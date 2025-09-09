"""
Custom exceptions and error handlers
"""
from typing import Any, Dict, Optional
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import structlog

logger = structlog.get_logger()


class LearnTrackException(Exception):
    """Base exception for LearnTrack application"""
    
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class DatabaseException(LearnTrackException):
    """Database operation exceptions"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details
        )


class NotFoundError(LearnTrackException):
    """Resource not found exception"""
    
    def __init__(self, resource: str, identifier: str):
        super().__init__(
            message=f"{resource} with ID '{identifier}' not found",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"resource": resource, "id": identifier}
        )


class ValidationError(LearnTrackException):
    """Validation error exception"""
    
    def __init__(self, message: str, field: Optional[str] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details={"field": field} if field else {}
        )


class AuthorizationError(LearnTrackException):
    """Authorization error exception"""
    
    def __init__(self, message: str = "Access denied"):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN
        )


class FileProcessingError(LearnTrackException):
    """File processing error exception"""
    
    def __init__(self, message: str, file_id: Optional[str] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details={"file_id": file_id} if file_id else {}
        )


class AIProviderError(LearnTrackException):
    """AI provider error exception"""
    
    def __init__(self, message: str, provider: Optional[str] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details={"provider": provider} if provider else {}
        )


# Exception handlers
async def learntrack_exception_handler(request: Request, exc: LearnTrackException):
    """Handle custom LearnTrack exceptions"""
    logger.error(
        "LearnTrack exception occurred",
        exception=exc.__class__.__name__,
        message=exc.message,
        status_code=exc.status_code,
        details=exc.details,
        path=request.url.path
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "type": exc.__class__.__name__,
                "message": exc.message,
                "details": exc.details
            }
        }
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions"""
    logger.warning(
        "HTTP exception occurred",
        status_code=exc.status_code,
        detail=exc.detail,
        path=request.url.path
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "type": "HTTPException",
                "message": exc.detail,
                "details": {}
            }
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation exceptions"""
    logger.warning(
        "Validation exception occurred",
        errors=exc.errors(),
        path=request.url.path
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "type": "ValidationError",
                "message": "Request validation failed",
                "details": {
                    "errors": exc.errors()
                }
            }
        }
    )


async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(
        "Unexpected exception occurred",
        exception=exc.__class__.__name__,
        message=str(exc),
        path=request.url.path,
        exc_info=True
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "type": "InternalServerError",
                "message": "An unexpected error occurred",
                "details": {}
            }
        }
    )
