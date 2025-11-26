"""
Activity/Event tracking models and schemas
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId
from enum import Enum

from app.models.user import PyObjectId


class ActivityType(str, Enum):
    """Activity types"""
    ASSIGNMENT_COMPLETED = "assignment_completed"
    ASSIGNMENT_STARTED = "assignment_started"
    ASSIGNMENT_SUBMITTED = "assignment_submitted"
    QUESTION_ANSWERED = "question_answered"
    LOGIN = "login"
    LOGOUT = "logout"
    MATERIAL_VIEWED = "material_viewed"
    MATERIAL_DOWNLOADED = "material_downloaded"
    MESSAGE_SENT = "message_sent"
    PROFILE_UPDATED = "profile_updated"
    INVITATION_SENT = "invitation_sent"
    INVITATION_ACCEPTED = "invitation_accepted"


class ActivityBase(BaseModel):
    """Base activity model"""
    activity_type: ActivityType = Field(..., description="Type of activity")
    user_id: str = Field(..., description="User's Clerk ID who performed the activity")
    tutor_id: str = Field(..., description="Tutor ID for tenant isolation")
    
    # Optional metadata
    description: Optional[str] = Field(None, description="Human-readable description")
    related_entity_id: Optional[str] = Field(None, description="ID of related entity")
    related_entity_type: Optional[str] = Field(None, description="Type of related entity")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class ActivityCreate(ActivityBase):
    """Activity creation model"""
    pass


class ActivityInDB(ActivityBase):
    """Activity model as stored in database"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


class Activity(BaseModel):
    """Activity response model"""
    id: str = Field(..., alias="_id")
    activity_type: ActivityType
    user_id: str
    tutor_id: str
    description: Optional[str] = None
    related_entity_id: Optional[str] = None
    related_entity_type: Optional[str] = None
    metadata: Dict[str, Any] = {}
    created_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={
            datetime: lambda v: v.isoformat() if v else None
        }
    )


class StudentActivitySummary(BaseModel):
    """Summary of student activities for display"""
    activity_type: str
    title: str
    description: str
    timestamp: datetime
    related_entity_id: Optional[str] = None
    icon: Optional[str] = None  # Icon name for frontend

