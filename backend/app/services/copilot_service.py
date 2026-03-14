import logging
from app.integrations.openai_client import chat_completion
from app.services.rag_service import retrieve_context, build_context_block
from app.repositories.message_repo import message_repo
from app.repositories.ticket_repo import ticket_repo

logger = logging.getLogger("euron.copilot")


async def suggest_reply(
    tenant_id: str,
    ticket_id: str | None = None,
    conversation_id: str | None = None,
    context: str | None = None,
) -> dict:
    """Generate a suggested reply for an agent based on ticket/conversation context."""
    # Gather context
    messages_context = ""
    if conversation_id:
        msgs = message_repo.list_by_conversation(conversation_id, tenant_id, limit=10)
        messages_context = "\n".join(
            f"[{m['sender_type']}]: {m['content']}" for m in msgs
        )
    elif ticket_id:
        ticket = ticket_repo.get_by_id(ticket_id, tenant_id)
        if ticket and ticket.get("conversation_id"):
            msgs = message_repo.list_by_conversation(
                ticket["conversation_id"], tenant_id, limit=10
            )
            messages_context = "\n".join(
                f"[{m['sender_type']}]: {m['content']}" for m in msgs
            )

    # Retrieve relevant KB context
    query = context or messages_context[-500:] if messages_context else "general support"
    chunks = await retrieve_context(query, tenant_id, top_k=3)
    kb_context = build_context_block(chunks)

    prompt_messages = [
        {
            "role": "system",
            "content": (
                "You are an AI copilot helping a support agent craft a reply. "
                "Generate a professional, helpful reply the agent can send to the customer. "
                "Use the conversation history and knowledge base context to inform your response. "
                "Be concise and actionable."
            ),
        },
        {
            "role": "system",
            "content": f"Knowledge base context:\n{kb_context}",
        },
        {
            "role": "user",
            "content": f"Conversation so far:\n{messages_context}\n\nGenerate a suggested reply:",
        },
    ]

    reply = await chat_completion(prompt_messages)
    sources = [c.get("metadata", {}).get("title", "") for c in chunks if c.get("metadata")]

    return {
        "suggested_reply": reply,
        "confidence": 0.85,
        "sources": sources,
    }


async def summarize(
    tenant_id: str,
    ticket_id: str | None = None,
    conversation_id: str | None = None,
) -> dict:
    """Generate a summary of a ticket or conversation."""
    messages_text = ""
    if conversation_id:
        msgs = message_repo.list_by_conversation(conversation_id, tenant_id, limit=30)
        messages_text = "\n".join(
            f"[{m['sender_type']}]: {m['content']}" for m in msgs
        )
    elif ticket_id:
        ticket = ticket_repo.get_by_id(ticket_id, tenant_id)
        if ticket and ticket.get("conversation_id"):
            msgs = message_repo.list_by_conversation(
                ticket["conversation_id"], tenant_id, limit=30
            )
            messages_text = "\n".join(
                f"[{m['sender_type']}]: {m['content']}" for m in msgs
            )

    if not messages_text:
        return {"summary": "No messages to summarize.", "key_points": []}

    prompt_messages = [
        {
            "role": "system",
            "content": (
                "Summarize the following support conversation. "
                "Provide a concise summary and a list of key points. "
                "Format: first line is the summary, then bullet points for key points."
            ),
        },
        {"role": "user", "content": messages_text},
    ]

    result = await chat_completion(prompt_messages)
    lines = result.strip().split("\n")
    summary = lines[0] if lines else ""
    key_points = [l.lstrip("- ").strip() for l in lines[1:] if l.strip().startswith("-")]

    return {"summary": summary, "key_points": key_points}


async def retrieve_kb_snippets(tenant_id: str, query: str, top_k: int = 5) -> list[dict]:
    """Retrieve knowledge base snippets for a query."""
    chunks = await retrieve_context(query, tenant_id, top_k=top_k)
    return [
        {
            "document_title": c.get("metadata", {}).get("title", "Unknown"),
            "content": c.get("content", ""),
            "relevance_score": c.get("similarity", 0),
        }
        for c in chunks
    ]
