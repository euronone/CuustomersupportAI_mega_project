from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.schemas.chat import ConversationResponse, CreateConversationRequest
from app.schemas.common import ApiResponse, PaginatedResponse
from app.core.security import get_current_user
from app.services import conversation_service
from app.repositories.message_repo import message_repo

router = APIRouter()


@router.get("", response_model=PaginatedResponse[ConversationResponse])
async def list_conversations(
    status: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    conversations, total = conversation_service.list_conversations(
        tenant_id=current_user["tenant_id"],
        status=status,
        customer_id=customer_id,
        limit=limit,
        offset=offset,
    )
    return PaginatedResponse(data=conversations, total=total)


@router.get("/{conversation_id}", response_model=ApiResponse[ConversationResponse])
async def get_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
):
    conv = conversation_service.get_conversation(
        conversation_id, current_user["tenant_id"]
    )
    return ApiResponse(data=conv)


@router.post("", response_model=ApiResponse[ConversationResponse], status_code=201)
async def create_conversation(
    body: CreateConversationRequest,
    current_user: dict = Depends(get_current_user),
):
    conv = conversation_service.create_conversation(
        tenant_id=current_user["tenant_id"],
        customer_id=body.customer_id,
        channel=body.channel,
    )
    return ApiResponse(data=conv)


@router.patch("/{conversation_id}", response_model=ApiResponse[ConversationResponse])
async def update_conversation(
    conversation_id: str,
    body: dict,
    current_user: dict = Depends(get_current_user),
):
    conv = conversation_service.update_conversation(
        conversation_id, current_user["tenant_id"], body
    )
    return ApiResponse(data=conv)


@router.get("/{conversation_id}/messages")
async def list_conversation_messages(
    conversation_id: str,
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user),
):
    messages = message_repo.list_by_conversation(
        conversation_id, current_user["tenant_id"], limit=limit
    )
    return {"data": messages, "total": len(messages)}
