from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.schemas.tickets import (
    CreateTicketRequest,
    UpdateTicketRequest,
    TicketResponse,
    TicketMessageRequest,
)
from app.schemas.common import ApiResponse, PaginatedResponse
from app.core.security import get_current_user
from app.services import ticket_service
from app.repositories.message_repo import message_repo

router = APIRouter()


@router.get("", response_model=PaginatedResponse[TicketResponse])
async def list_tickets(
    status: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    tickets, total = ticket_service.list_tickets(
        tenant_id=current_user["tenant_id"],
        status=status,
        limit=limit,
        offset=offset,
    )
    return PaginatedResponse(data=tickets, total=total)


@router.get("/{ticket_id}", response_model=ApiResponse[TicketResponse])
async def get_ticket(
    ticket_id: str,
    current_user: dict = Depends(get_current_user),
):
    ticket = ticket_service.get_ticket(ticket_id, current_user["tenant_id"])
    return ApiResponse(data=ticket)


@router.post("", response_model=ApiResponse[TicketResponse], status_code=201)
async def create_ticket(
    body: CreateTicketRequest,
    current_user: dict = Depends(get_current_user),
):
    ticket = ticket_service.create_ticket(
        tenant_id=current_user["tenant_id"],
        customer_id=body.customer_id,
        subject=body.subject,
        conversation_id=body.conversation_id,
        priority=body.priority.value,
    )
    return ApiResponse(data=ticket)


@router.patch("/{ticket_id}", response_model=ApiResponse[TicketResponse])
async def update_ticket(
    ticket_id: str,
    body: UpdateTicketRequest,
    current_user: dict = Depends(get_current_user),
):
    update_data = body.model_dump(exclude_none=True)
    # Convert enum to string values
    for key in ("status", "priority"):
        if key in update_data and hasattr(update_data[key], "value"):
            update_data[key] = update_data[key].value

    ticket = ticket_service.update_ticket(
        ticket_id, current_user["tenant_id"], update_data
    )
    return ApiResponse(data=ticket)


@router.get("/{ticket_id}/messages")
async def list_ticket_messages(
    ticket_id: str,
    current_user: dict = Depends(get_current_user),
):
    # Get ticket to find conversation_id
    ticket = ticket_service.get_ticket(ticket_id, current_user["tenant_id"])
    conv_id = ticket.get("conversation_id")
    if not conv_id:
        return {"data": [], "total": 0}

    messages = message_repo.list_by_conversation(
        conv_id, current_user["tenant_id"]
    )
    return {"data": messages, "total": len(messages)}


@router.post("/{ticket_id}/messages", status_code=201)
async def add_ticket_message(
    ticket_id: str,
    body: TicketMessageRequest,
    current_user: dict = Depends(get_current_user),
):
    import uuid
    from datetime import datetime, timezone

    ticket = ticket_service.get_ticket(ticket_id, current_user["tenant_id"])
    conv_id = ticket.get("conversation_id")
    if not conv_id:
        return {"code": "NO_CONVERSATION", "message": "Ticket has no linked conversation"}

    now = datetime.now(timezone.utc).isoformat()
    msg = message_repo.create({
        "id": str(uuid.uuid4()),
        "tenant_id": current_user["tenant_id"],
        "conversation_id": conv_id,
        "sender_type": "agent",
        "sender_id": current_user["id"],
        "channel": "chat",
        "content": body.content,
        "content_type": "text",
        "created_at": now,
        "updated_at": now,
    })
    return {"data": msg}
