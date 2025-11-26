"""
Notification models and schemas
"""
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId
from enum import Enum

from app.models.user import PyObjectId


class NotificationType(str, Enum):
    """Notification types"""
    ASSIGNMENT_SUBMITTED = "assignment_submitted"
    ASSIGNMENT_GRADED = "assignment_graded"
    QUESTION_APPROVED = "question_approved"
    QUESTION_REJECTED = "question_rejected"
    STUDENT_JOINED = "student_joined"
    PARENT_JOINED = "parent_joined"
    MESSAGE_RECEIVED = "message_received"
    ASSIGNMENT_DUE_SOON = "assignment_due_soon"
    ASSIGNMENT_OVERDUE = "assignment_overdue"
    INVITATION_ACCEPTED = "invitation_accepted"
    SYSTEM = "system"


class NotificationBase(BaseModel):
    """Base notification model"""
    title: str = Field(..., description="Notification title")
    message: str = Field(..., description="Notification message")
    notification_type: NotificationType = Field(..., description="Type of notification")
    recipient_id: str = Field(..., description="Recipient's Clerk ID")
    tutor_id: str = Field(..., description="Tutor ID for tenant isolation")
    
    # Optional metadata
    related_entity_id: Optional[str] = Field(None, description="ID of related entity (assignment, question, etc.)")
    related_entity_type: Optional[str] = Field(None, description="Type of related entity")
    action_url: Optional[str] = Field(None, description="URL to navigate to when clicked")


class NotificationCreate(NotificationBase):
    """Notification creation model"""
    pass


class NotificationUpdate(BaseModel):
    """Notification update model"""
    is_read: Optional[bool] = None


class NotificationInDB(NotificationBase):
    """Notification model as stored in database"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    is_read: bool = Field(default=False, description="Whether notification has been read")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    read_at: Optional[datetime] = Field(None, description="When notification was read")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


class Notification(BaseModel):
    """Notification response model"""
    id: str = Field(..., alias="_id")
    title: str
    message: str
    notification_type: NotificationType
    recipient_id: str
    tutor_id: str
    related_entity_id: Optional[str] = None
    related_entity_type: Optional[str] = None
    action_url: Optional[str] = None
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={
            datetime: lambda v: v.isoformat() if v else None
        }
    )

