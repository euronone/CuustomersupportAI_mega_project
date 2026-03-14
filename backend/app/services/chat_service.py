import uuid
import logging
from datetime import datetime, timezone

from app.repositories.conversation_repo import conversation_repo
from app.repositories.message_repo import message_repo
from app.services.rag_service import generate_answer

logger = logging.getLogger("euron.chat")


async def get_or_create_conversation(
    conversation_id: str | None,
    tenant_id: str,
    customer_id: str,
    channel: str = "chat",
) -> dict:
    """Get existing conversation or create a new one."""
    if conversation_id:
        conv = conversation_repo.get_by_id(conversation_id, tenant_id)
        if conv:
            return conv

    new_conv = conversation_repo.create({
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "customer_id": customer_id,
        "channel": channel,
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    return new_conv


async def handle_message(
    conversation_id: str,
    tenant_id: str,
    content: str,
    sender_type: str = "customer",
    sender_id: str | None = None,
) -> dict:
    """
    Process an incoming message:
    1. Store the user message
    2. Generate AI response via RAG
    3. Store and return the AI response
    """
    now = datetime.now(timezone.utc).isoformat()

    # Store user message
    user_msg = message_repo.create({
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "conversation_id": conversation_id,
        "sender_type": sender_type,
        "sender_id": sender_id,
        "channel": "chat",
        "content": content,
        "content_type": "text",
        "created_at": now,
        "updated_at": now,
    })

    # Get conversation history for context
    history_msgs = message_repo.list_by_conversation(conversation_id, tenant_id, limit=10)
    conversation_history = []
    for msg in history_msgs[:-1]:  # Exclude the message we just stored
        role = "assistant" if msg["sender_type"] in ("ai", "system") else "user"
        conversation_history.append({"role": role, "content": msg["content"]})

    # Generate AI response
    answer, chunks = await generate_answer(
        query=content,
        tenant_id=tenant_id,
        conversation_history=conversation_history,
    )

    # Store AI response
    ai_msg = message_repo.create({
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "conversation_id": conversation_id,
        "sender_type": "ai",
        "sender_id": None,
        "channel": "chat",
        "content": answer,
        "content_type": "text",
        "metadata": {
            "citations": [
                {
                    "document_title": c.get("metadata", {}).get("title", ""),
                    "chunk_content": c.get("content", "")[:200],
                    "relevance_score": c.get("similarity", 0),
                }
                for c in chunks
            ]
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })

    # Update conversation timestamp
    conversation_repo.update(conversation_id, tenant_id, {
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })

    return ai_msg


async def get_conversation_history(
    conversation_id: str, tenant_id: str, limit: int = 50
) -> list[dict]:
    """Get message history for a conversation."""
    return message_repo.list_by_conversation(conversation_id, tenant_id, limit=limit)
