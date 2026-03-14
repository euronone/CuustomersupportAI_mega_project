import uuid
import logging
from datetime import datetime, timezone

from app.repositories.ticket_repo import ticket_repo
from app.repositories.agent_repo import agent_repo
from app.core.exceptions import NotFoundException

logger = logging.getLogger("euron.tickets")


def get_ticket(ticket_id: str, tenant_id: str) -> dict:
    ticket = ticket_repo.get_by_id(ticket_id, tenant_id)
    if not ticket:
        raise NotFoundException("Ticket", ticket_id)
    return ticket


def list_tickets(
    tenant_id: str,
    status: str | None = None,
    assigned_agent_id: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[dict], int]:
    return ticket_repo.list(
        tenant_id=tenant_id,
        status=status,
        assigned_agent_id=assigned_agent_id,
        limit=limit,
        offset=offset,
    )


def create_ticket(
    tenant_id: str,
    customer_id: str,
    subject: str,
    conversation_id: str | None = None,
    priority: str = "medium",
) -> dict:
    """Create a new ticket and optionally auto-assign to an available agent."""
    now = datetime.now(timezone.utc).isoformat()

    # Auto-assign: pick the available agent with the fewest active tickets
    assigned_agent_id = None
    available_agents = agent_repo.get_available(tenant_id)
    if available_agents:
        assigned_agent_id = available_agents[0]["id"]

    ticket = ticket_repo.create({
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "customer_id": customer_id,
        "conversation_id": conversation_id,
        "subject": subject,
        "status": "open",
        "priority": priority,
        "assigned_agent_id": assigned_agent_id,
        "created_at": now,
        "updated_at": now,
    })

    logger.info(
        "ticket_created",
        extra={
            "ticket_id": ticket["id"],
            "tenant_id": tenant_id,
            "priority": priority,
            "assigned_agent_id": assigned_agent_id,
        },
    )

    return ticket


def update_ticket(ticket_id: str, tenant_id: str, data: dict) -> dict:
    # Ensure ticket exists
    get_ticket(ticket_id, tenant_id)

    data["updated_at"] = datetime.now(timezone.utc).isoformat()

    if data.get("status") in ("resolved", "closed"):
        data["closed_at"] = datetime.now(timezone.utc).isoformat()

    return ticket_repo.update(ticket_id, tenant_id, data)
