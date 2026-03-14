import uuid
from datetime import datetime, timezone

from app.repositories.conversation_repo import conversation_repo
from app.core.exceptions import NotFoundException


def get_conversation(conversation_id: str, tenant_id: str) -> dict:
    conv = conversation_repo.get_by_id(conversation_id, tenant_id)
    if not conv:
        raise NotFoundException("Conversation", conversation_id)
    return conv


def list_conversations(
    tenant_id: str,
    status: str | None = None,
    customer_id: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[dict], int]:
    return conversation_repo.list(
        tenant_id=tenant_id,
        status=status,
        customer_id=customer_id,
        limit=limit,
        offset=offset,
    )


def create_conversation(tenant_id: str, customer_id: str, channel: str = "chat") -> dict:
    now = datetime.now(timezone.utc).isoformat()
    return conversation_repo.create({
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "customer_id": customer_id,
        "channel": channel,
        "status": "open",
        "created_at": now,
        "updated_at": now,
    })


def update_conversation(conversation_id: str, tenant_id: str, data: dict) -> dict:
    get_conversation(conversation_id, tenant_id)
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    if data.get("status") == "closed":
        data["closed_at"] = datetime.now(timezone.utc).isoformat()
    return conversation_repo.update(conversation_id, tenant_id, data)
