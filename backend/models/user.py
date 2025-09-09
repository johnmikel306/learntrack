"""
User models for LearnTrack application
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from enum import Enum

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class UserRole(str, Enum):
    TUTOR = "tutor"
    STUDENT = "student"
    PARENT = "parent"

class NotificationPreferences(BaseModel):
    email: bool = True
    sms: bool = False
    frequency: str = "daily"  # "daily", "weekly", "immediate"

class TutorProfile(BaseModel):
    subjects: List[str] = []
    bio: Optional[str] = None
    experience: Optional[int] = None  # years
    students: List[PyObjectId] = []

class StudentProfile(BaseModel):
    age: Optional[int] = None
    grade: Optional[str] = None
    tutors: List[PyObjectId] = []
    parents: List[PyObjectId] = []
    subjects: List[str] = []

class ParentProfile(BaseModel):
    children: List[PyObjectId] = []
    notification_preferences: NotificationPreferences = NotificationPreferences()

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole
    profile_image: Optional[str] = None

class UserCreate(UserBase):
    clerk_id: str
    tutor_profile: Optional[TutorProfile] = None
    student_profile: Optional[StudentProfile] = None
    parent_profile: Optional[ParentProfile] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_image: Optional[str] = None
    tutor_profile: Optional[TutorProfile] = None
    student_profile: Optional[StudentProfile] = None
    parent_profile: Optional[ParentProfile] = None

class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    clerk_id: str
    tutor_profile: Optional[TutorProfile] = None
    student_profile: Optional[StudentProfile] = None
    parent_profile: Optional[ParentProfile] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserResponse(UserBase):
    id: str
    clerk_id: str
    tutor_profile: Optional[TutorProfile] = None
    student_profile: Optional[StudentProfile] = None
    parent_profile: Optional[ParentProfile] = None
    created_at: datetime
    updated_at: datetime

# Relationship models
class StudentTutorRelation(BaseModel):
    student_id: PyObjectId
    tutor_id: PyObjectId
    subjects: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ParentChildRelation(BaseModel):
    parent_id: PyObjectId
    child_id: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
