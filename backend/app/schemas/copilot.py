from pydantic import BaseModel
from typing import Optional


class SuggestReplyRequest(BaseModel):
    ticket_id: Optional[str] = None
    conversation_id: Optional[str] = None
    context: Optional[str] = None


class SuggestReplyResponse(BaseModel):
    suggested_reply: str
    confidence: float
    sources: list[str] = []


class SummarizeRequest(BaseModel):
    ticket_id: Optional[str] = None
    conversation_id: Optional[str] = None


class SummarizeResponse(BaseModel):
    summary: str
    key_points: list[str] = []


class KBRetrieveRequest(BaseModel):
    query: str
    top_k: int = 5


class KBSnippet(BaseModel):
    document_title: str
    content: str
    relevance_score: float


class KBRetrieveResponse(BaseModel):
    snippets: list[KBSnippet]
