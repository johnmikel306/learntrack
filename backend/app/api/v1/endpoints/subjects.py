"""
Subject management endpoints with tenant isolation
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Path, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog

from app.core.database import get_database
# Authentication removed - no tenant dependencies needed
from app.services.user_service import UserService
from app.services.subject_service import SubjectService
from app.models.subject import Subject, SubjectCreate, SubjectUpdate, SubjectWithStats

logger = structlog.get_logger()

router = APIRouter()

@router.post("/", response_model=Subject)
async def create_subject(
    subject_data: SubjectCreate,
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new subject"""
    try:
        subject_service = SubjectService(database)
        subject = await subject_service.create_subject(subject_data)
        return subject
    except Exception as e:
        logger.error("Failed to create subject", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create subject")

@router.get("/", response_model=List[Subject])
async def get_subjects(database: AsyncIOMotorDatabase = Depends(get_database)):
    """Get all subjects"""
    try:
        # For development, get all subjects directly from database
        cursor = database.subjects.find({})
        subjects_data = await cursor.to_list(length=None)

        # Convert to Subject models with proper field mapping
        subjects = []
        for subject_data in subjects_data:
            # Convert ObjectId to string for the id field
            subject_data["id"] = str(subject_data.pop("_id"))

            # Ensure all required fields are present
            if "tenant_id" not in subject_data:
                subject_data["tenant_id"] = "default_tenant"
            if "tutor_id" not in subject_data:
                subject_data["tutor_id"] = "default_tutor"
            if "question_count" not in subject_data:
                subject_data["question_count"] = 0
            if "is_active" not in subject_data:
                subject_data["is_active"] = True

            subjects.append(Subject(**subject_data))

        return subjects
    except Exception as e:
        logger.error("Failed to get subjects", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve subjects")


@router.get("/{subject_id}", response_model=Subject)
async def get_subject(
    subject_id: str = Path(..., description="Subject ID"),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get subject by ID"""
    try:
        subject_service = SubjectService(database)
        subject = await subject_service.get_subject_by_id(subject_id)
        return subject
    except Exception as e:
        logger.error("Failed to get subject", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve subject")

@router.get("/{subject_id}/stats", response_model=SubjectWithStats)
async def get_subject_with_stats(
    subject_id: str = Path(..., description="Subject ID"),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get subject with statistics"""
    try:
        subject_service = SubjectService(database)
        subject_stats = await subject_service.get_subject_with_stats(subject_id)
        return subject_stats
    except Exception as e:
        logger.error("Failed to get subject stats", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve subject statistics")

@router.put("/{subject_id}", response_model=Subject)
async def update_subject(
    subject_update: SubjectUpdate,
    subject_id: str = Path(..., description="Subject ID"),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update subject"""
    try:
        subject_service = SubjectService(database)
        subject = await subject_service.update_subject(subject_id, subject_update, "default_tutor")
        return subject
    except Exception as e:
        logger.error("Failed to update subject", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update subject")

@router.delete("/{subject_id}")
async def delete_subject(
    subject_id: str = Path(..., description="Subject ID"),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete subject"""
    try:
        subject_service = SubjectService(database)
        await subject_service.delete_subject(subject_id, "default_tutor")
        return {"message": "Subject deleted successfully"}
    except Exception as e:
        logger.error("Failed to delete subject", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to delete subject")

@router.post("/{subject_id}/topics/{topic}")
async def add_topic_to_subject(
    subject_id: str = Path(..., description="Subject ID"),
    topic: str = Path(..., description="Topic name"),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Add topic to subject"""
    try:
        subject_service = SubjectService(database)
        subject = await subject_service.add_topic_to_subject(subject_id, topic, "default_tutor")
        return {"message": f"Topic '{topic}' added successfully", "subject": subject}
    except Exception as e:
        logger.error("Failed to add topic", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to add topic")


@router.delete("/{subject_id}/topics/{topic}")
async def remove_topic_from_subject(
    subject_id: str = Path(..., description="Subject ID"),
    topic: str = Path(..., description="Topic name"),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Remove topic from subject"""
    try:
        subject_service = SubjectService(database)
        subject = await subject_service.remove_topic_from_subject(subject_id, topic, "default_tutor")
        return {"message": f"Topic '{topic}' removed successfully", "subject": subject}
    except Exception as e:
        logger.error("Failed to remove topic", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to remove topic")
