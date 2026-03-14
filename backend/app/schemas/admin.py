from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class AgentStatus(str, Enum):
    available = "available"
    busy = "busy"
    offline = "offline"


class AgentResponse(BaseModel):
    id: str
    tenant_id: str
    user_id: str
    display_name: str
    status: AgentStatus
    skills: list[str] = []
    active_tickets: int = 0
    created_at: datetime
    updated_at: datetime


class UpdateAgentRequest(BaseModel):
    status: Optional[AgentStatus] = None
    skills: Optional[list[str]] = None


class AIConfigResponse(BaseModel):
    model: str
    temperature: float
    max_tokens: int
    embedding_model: str
    rag_top_k: int


class UpdateAIConfigRequest(BaseModel):
    model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None


class ApiKeyResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    key_prefix: str
    created_at: datetime
    last_used_at: Optional[datetime] = None


class CreateApiKeyRequest(BaseModel):
    name: str
    scopes: list[str] = []


class CreateApiKeyResponse(BaseModel):
    id: str
    name: str
    key: str  # Raw key, shown only once
    created_at: datetime
