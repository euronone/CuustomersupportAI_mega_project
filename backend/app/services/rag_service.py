import logging
from app.integrations.openai_client import generate_embedding, chat_completion
from app.repositories.knowledge_repo import knowledge_chunk_repo
from app.core.config import settings

logger = logging.getLogger("euron.rag")

SYSTEM_PROMPT = """You are Euron, a professional AI customer support assistant.
Answer the user's question based ONLY on the provided context. If the context
does not contain enough information to answer, say so honestly.
Always be professional, concise, and helpful. Cite your sources when possible."""


async def retrieve_context(query: str, tenant_id: str, top_k: int | None = None) -> list[dict]:
    """Embed the query and retrieve the most relevant KB chunks."""
    k = top_k or settings.RAG_TOP_K
    embedding = await generate_embedding(query)
    chunks = knowledge_chunk_repo.search_similar(
        tenant_id=tenant_id,
        embedding=embedding,
        top_k=k,
    )
    return chunks


def build_context_block(chunks: list[dict]) -> str:
    """Format retrieved chunks into a context string for the LLM."""
    if not chunks:
        return "No relevant knowledge base articles found."

    parts = []
    for i, chunk in enumerate(chunks, 1):
        title = chunk.get("metadata", {}).get("title", "Unknown")
        content = chunk.get("content", "")
        parts.append(f"[Source {i}: {title}]\n{content}")
    return "\n\n".join(parts)


async def generate_answer(
    query: str,
    tenant_id: str,
    conversation_history: list[dict] | None = None,
) -> tuple[str, list[dict]]:
    """
    Full RAG pipeline: retrieve context -> assemble prompt -> generate answer.
    Returns (answer_text, retrieved_chunks).
    """
    chunks = await retrieve_context(query, tenant_id)
    context_block = build_context_block(chunks)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": f"Context from knowledge base:\n\n{context_block}"},
    ]

    # Add conversation history for follow-up understanding
    if conversation_history:
        for msg in conversation_history[-6:]:  # Last 6 messages for context window
            messages.append(msg)

    messages.append({"role": "user", "content": query})

    answer = await chat_completion(messages)

    logger.info(
        "rag_answer_generated",
        extra={
            "tenant_id": tenant_id,
            "chunks_retrieved": len(chunks),
            "query_length": len(query),
        },
    )

    return answer, chunks
