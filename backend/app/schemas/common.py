from pydantic import BaseModel
from typing import Generic, TypeVar, Optional

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    data: T
    message: Optional[str] = None


class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    total: int
    next_cursor: Optional[str] = None


class ErrorResponse(BaseModel):
    code: str
    message: str
    details: Optional[dict] = None
