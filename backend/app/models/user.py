"""
User models and schemas
"""
from datetime import datetime, timezone
from typing import Optional, List, Any
from enum import Enum
from pydantic import BaseModel, Field, EmailStr, field_validator, ConfigDict
from bson import ObjectId


class UserRole(str, Enum):
    """User roles in the system"""
    TUTOR = "tutor"
    STUDENT = "student"
    PARENT = "parent"


# Use string type for ObjectId to avoid Pydantic v2 compatibility issues
PyObjectId = str


class UserBase(BaseModel):
    """Base user model"""
    email: EmailStr
    name: str
    role: UserRole
    is_active: bool = True
    slug: Optional[str] = None  # URL-friendly slug (e.g., "john-doe")


class UserCreate(UserBase):
    """User creation model"""
    clerk_id: str  # Clerk ID field - required for new users
    tutor_id: Optional[str] = None  # Will be set automatically for tutors
    tenant_id: Optional[str] = None  # Tenant ID for multi-tenancy


class UserUpdate(BaseModel):
    """User update model"""
    name: Optional[str] = None
    is_active: Optional[bool] = None


class UserInDB(UserBase):
    """User model as stored in database"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    clerk_id: str  # Clerk ID field - required
    tutor_id: Optional[str] = None  # Tutor ID - for tutors: their own clerk_id, for others: their tutor's clerk_id
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None

    # Role-specific fields
    tutor_subjects: Optional[List[str]] = []  # Subject IDs for tutors
    student_tutors: Optional[List[str]] = []  # Tutor IDs for students
    parent_children: Optional[List[str]] = []  # Student IDs for parents
    student_ids: List[str] = []  # For parents: linked student IDs

    @field_validator('id', mode='before')
    @classmethod
    def validate_object_id(cls, v):
        """Convert ObjectId to string for Pydantic validation"""
        if isinstance(v, ObjectId):
            return str(v)
        return v

    @field_validator('tutor_id', mode='before')
    @classmethod
    def migrate_tutor_id(cls, v, info):
        """Migrate tutor_id for existing users - set to clerk_id for tutors, None for others"""
        if v is None and info.data.get('role') == UserRole.TUTOR:
            # For tutors without tutor_id, use their clerk_id
            return info.data.get('clerk_id')
        return v

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


class User(UserInDB):
    """User response model"""
    pass


class UserProfile(BaseModel):
    """User profile for frontend"""
    id: str
    email: str
    name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    
    # Role-specific data
    subjects_count: Optional[int] = 0
    students_count: Optional[int] = 0
    children_count: Optional[int] = 0


class StudentAssignment(BaseModel):
    """Student assignment relationship"""
    student_id: str
    tutor_id: str
    assigned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True


class ParentChildRelation(BaseModel):
    """Parent-child relationship"""
    parent_id: str
    child_id: str
    relation_type: str = "parent"  # parent, guardian, etc.
    assigned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True
