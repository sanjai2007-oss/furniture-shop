from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    message: Optional[str] = "Operation successful"
    data: Optional[T] = None

class PaginatedMeta(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int

class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    message: Optional[str] = "Success"
    data: List[T]
    pagination: PaginatedMeta
