"""
File handling models for UploadThing integration
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from enum import Enum
from pydantic import BaseModel, Field, HttpUrl, ConfigDict

from app.models.user import PyObjectId


class FileType(str, Enum):
    """Supported file types"""
    PDF = "application/pdf"
    PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    PPT = "application/vnd.ms-powerpoint"
    DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    DOC = "application/msword"
    TXT = "text/plain"


class FileStatus(str, Enum):
    """File processing status"""
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    PROCESSED = "processed"
    ERROR = "error"


class EmbeddingStatus(str, Enum):
    """RAG embedding status for files"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class UploadedFile(BaseModel):
    """UploadThing file model"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")

    # UploadThing specific fields
    uploadthing_key: str  # UploadThing file key
    uploadthing_url: HttpUrl  # UploadThing file URL
    filename: str
    content_type: str
    size: int

    # User and metadata
    uploaded_by: str  # user_id
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    tutor_id: str = Field(..., description="Tutor ID - references the tutor's Clerk user ID")

    # Processing metadata
    status: FileStatus = FileStatus.UPLOADED
    processing_started_at: Optional[datetime] = None
    processing_completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    # AI processing results
    extracted_text: Optional[str] = None
    generated_questions_count: int = 0
    ai_provider_used: Optional[str] = None
    processing_time: Optional[float] = None

    # Subject/topic assignment
    subject_id: Optional[str] = None
    topic: Optional[str] = None

    # RAG-specific fields
    qdrant_collection_id: Optional[str] = None
    embedding_status: EmbeddingStatus = EmbeddingStatus.PENDING
    chunk_count: int = 0
    embedding_model_used: Optional[str] = None
    last_embedded_at: Optional[datetime] = None
    tags: List[str] = []
    category: Optional[str] = None
    embedding_error: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={str: str}
    )


class UploadThingWebhookPayload(BaseModel):
    """UploadThing webhook payload"""
    eventType: str
    data: Dict[str, Any]


class FileMetadataRequest(BaseModel):
    """Request to register file metadata after UploadThing upload"""
    uploadthing_key: str
    uploadthing_url: HttpUrl
    filename: str
    content_type: str
    size: int
    subject_id: str
    topic: str
    ai_provider: Optional[str] = "openai"
    question_count: int = 10
    difficulty_level: str = "medium"


class FileRegistrationResponse(BaseModel):
    """Response after registering file metadata"""
    file_id: str
    filename: str
    size: int
    status: FileStatus
    uploadthing_url: str
    message: str


class FileProcessingResult(BaseModel):
    """File processing result"""
    file_id: str
    status: FileStatus
    questions_generated: int = 0
    processing_time: Optional[float] = None
    error_message: Optional[str] = None


class UploadThingFileCreate(BaseModel):
    """Create file record from UploadThing data"""
    uploadthing_key: str
    uploadthing_url: HttpUrl
    filename: str
    content_type: str
    size: int
    uploaded_by: str
    subject_id: Optional[str] = None
    topic: Optional[str] = None


class UploadThingFileUpdate(BaseModel):
    """Update file record"""
    status: Optional[FileStatus] = None
    processing_started_at: Optional[datetime] = None
    processing_completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    extracted_text: Optional[str] = None
    generated_questions_count: Optional[int] = None
    ai_provider_used: Optional[str] = None
    processing_time: Optional[float] = None
    subject_id: Optional[str] = None
    topic: Optional[str] = None
