from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ChatCompletionRequest(BaseModel):
    conversation_id: str
    content: str


class Citation(BaseModel):
    document_title: str
    chunk_content: str
    relevance_score: float


class ChatMessageResponse(BaseModel):
    id: str
    conversation_id: str
    content: str
    sender_type: str
    citations: list[Citation] = []
    created_at: datetime


class ConversationResponse(BaseModel):
    id: str
    tenant_id: str
    customer_id: str
    channel: str
    status: str
    assigned_agent_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CreateConversationRequest(BaseModel):
    customer_id: str
    channel: str = "chat"
