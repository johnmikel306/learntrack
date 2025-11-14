"""
Pagination utilities for API endpoints
"""
from typing import TypeVar, Generic, List, Optional
from pydantic import BaseModel, Field
from math import ceil

T = TypeVar('T')


class PaginationParams(BaseModel):
    """Pagination query parameters"""
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    per_page: int = Field(default=10, ge=1, le=100, description="Items per page")
    
    @property
    def skip(self) -> int:
        """Calculate skip value for database query"""
        return (self.page - 1) * self.per_page
    
    @property
    def limit(self) -> int:
        """Get limit value for database query"""
        return self.per_page


class PaginationMeta(BaseModel):
    """Pagination metadata"""
    page: int = Field(..., description="Current page number")
    per_page: int = Field(..., description="Items per page")
    total: int = Field(..., description="Total number of items")
    total_pages: int = Field(..., description="Total number of pages")
    has_next: bool = Field(..., description="Whether there is a next page")
    has_prev: bool = Field(..., description="Whether there is a previous page")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response"""
    items: List[T] = Field(..., description="List of items")
    meta: PaginationMeta = Field(..., description="Pagination metadata")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "items": [],
                "meta": {
                    "page": 1,
                    "per_page": 10,
                    "total": 100,
                    "total_pages": 10,
                    "has_next": True,
                    "has_prev": False
                }
            }
        }
    }


def create_pagination_meta(
    page: int,
    per_page: int,
    total: int
) -> PaginationMeta:
    """
    Create pagination metadata
    
    Args:
        page: Current page number (1-indexed)
        per_page: Items per page
        total: Total number of items
        
    Returns:
        PaginationMeta object
    """
    total_pages = ceil(total / per_page) if per_page > 0 else 0
    
    return PaginationMeta(
        page=page,
        per_page=per_page,
        total=total,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1
    )


def paginate(
    items: List[T],
    page: int,
    per_page: int,
    total: int
) -> PaginatedResponse[T]:
    """
    Create a paginated response
    
    Args:
        items: List of items for current page
        page: Current page number
        per_page: Items per page
        total: Total number of items
        
    Returns:
        PaginatedResponse object
    """
    meta = create_pagination_meta(page, per_page, total)
    
    return PaginatedResponse(
        items=items,
        meta=meta
    )

