from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class DocumentStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    ready = "ready"
    failed = "failed"


class KnowledgeDocumentResponse(BaseModel):
    id: str
    tenant_id: str
    title: str
    source_type: str
    source_ref: Optional[str] = None
    status: DocumentStatus
    version: int
    chunk_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class IngestUrlRequest(BaseModel):
    url: str


class CollectionResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    description: Optional[str] = None
    document_count: int = 0
    created_at: datetime


class CreateCollectionRequest(BaseModel):
    name: str
    description: Optional[str] = None
