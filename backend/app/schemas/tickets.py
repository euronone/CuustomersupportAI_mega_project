from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class TicketStatus(str, Enum):
    open = "open"
    pending = "pending"
    resolved = "resolved"
    closed = "closed"


class TicketPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class CreateTicketRequest(BaseModel):
    subject: str
    customer_id: str
    conversation_id: Optional[str] = None
    priority: TicketPriority = TicketPriority.medium


class UpdateTicketRequest(BaseModel):
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    assigned_agent_id: Optional[str] = None


class TicketResponse(BaseModel):
    id: str
    tenant_id: str
    conversation_id: Optional[str] = None
    customer_id: str
    subject: str
    status: TicketStatus
    priority: TicketPriority
    assigned_agent_id: Optional[str] = None
    sla_due_at: Optional[datetime] = None
    summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None


class TicketMessageRequest(BaseModel):
    content: str


class TicketMessageResponse(BaseModel):
    id: str
    ticket_id: str
    sender_type: str
    sender_id: Optional[str] = None
    content: str
    created_at: datetime
