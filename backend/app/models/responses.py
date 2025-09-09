"""
Common response models for API documentation
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any, Dict

class ErrorResponse(BaseModel):
    """Standard error response model"""
    detail: str = Field(..., description="Error message describing what went wrong", example="Student not found")
    error_code: Optional[str] = Field(None, description="Machine-readable error code", example="STUDENT_NOT_FOUND")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "detail": "Student with ID 507f1f77bcf86cd799439011 not found",
                "error_code": "STUDENT_NOT_FOUND"
            }
        }
    )

class ValidationErrorResponse(BaseModel):
    """Validation error response model"""
    detail: list = Field(..., description="List of validation errors")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "detail": [
                    {
                        "loc": ["body", "email"],
                        "msg": "field required",
                        "type": "value_error.missing"
                    }
                ]
            }
        }
    )

class SuccessResponse(BaseModel):
    """Generic success response model"""
    message: str = Field(..., description="Success message", example="Operation completed successfully")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional response data")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": "Student deleted successfully",
                "data": {"student_id": "507f1f77bcf86cd799439011"}
            }
        }
    )

class HealthResponse(BaseModel):
    """Health check response model"""
    status: str = Field(..., description="Service health status", example="healthy")
    service: str = Field(..., description="Service name", example="learntrack-api")
    version: Optional[str] = Field(None, description="API version", example="1.0.0")
    timestamp: Optional[str] = Field(None, description="Response timestamp")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "healthy",
                "service": "learntrack-api",
                "version": "1.0.0",
                "timestamp": "2024-01-15T10:30:00Z"
            }
        }
    )
