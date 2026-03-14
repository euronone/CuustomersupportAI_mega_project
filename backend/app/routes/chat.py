import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends

from app.schemas.chat import ChatCompletionRequest, ChatMessageResponse
from app.schemas.common import ApiResponse
from app.core.security import get_current_user, decode_token
from app.services import chat_service

router = APIRouter()


@router.post("/chat/completions", response_model=ApiResponse[ChatMessageResponse])
async def chat_completion(
    body: ChatCompletionRequest,
    current_user: dict = Depends(get_current_user),
):
    """Synchronous chat completion (REST fallback)."""
    ai_msg = await chat_service.handle_message(
        conversation_id=body.conversation_id,
        tenant_id=current_user["tenant_id"],
        content=body.content,
        sender_type="customer",
        sender_id=current_user["id"],
    )

    citations = ai_msg.get("metadata", {}).get("citations", [])

    return ApiResponse(
        data=ChatMessageResponse(
            id=ai_msg["id"],
            conversation_id=ai_msg["conversation_id"],
            content=ai_msg["content"],
            sender_type=ai_msg["sender_type"],
            citations=citations,
            created_at=ai_msg["created_at"],
        )
    )


@router.get("/chat/conversations/{conversation_id}/history")
async def get_chat_history(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get conversation message history."""
    messages = await chat_service.get_conversation_history(
        conversation_id=conversation_id,
        tenant_id=current_user["tenant_id"],
    )
    return {"data": messages, "total": len(messages)}


@router.websocket("/ws/chat/{conversation_id}")
async def websocket_chat(websocket: WebSocket, conversation_id: str):
    """WebSocket endpoint for live chat with streamed AI responses."""
    await websocket.accept()

    # Authenticate via query param
    token = websocket.query_params.get("token", "")
    try:
        user = decode_token(token)
    except Exception:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    tenant_id = user.get("tenant_id", "")
    user_id = user.get("sub", "")

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            content = payload.get("content", "")

            if not content:
                continue

            # Process message
            ai_msg = await chat_service.handle_message(
                conversation_id=conversation_id,
                tenant_id=tenant_id,
                content=content,
                sender_type="customer",
                sender_id=user_id,
            )

            citations = ai_msg.get("metadata", {}).get("citations", [])

            # Send response
            await websocket.send_json({
                "type": "message",
                "data": {
                    "id": ai_msg["id"],
                    "content": ai_msg["content"],
                    "sender_type": "ai",
                    "citations": citations,
                    "created_at": ai_msg["created_at"],
                },
            })

    except WebSocketDisconnect:
        pass
    except Exception:
        await websocket.close(code=1011, reason="Internal error")
