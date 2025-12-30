"""
Subject management endpoints with tenant isolation
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Path, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import structlog

from app.core.database import get_database
from app.core.enhanced_auth import require_tutor, ClerkUserContext
from app.services.user_service import UserService
from app.services.subject_service import SubjectService
from app.models.subject import Subject, SubjectCreate, SubjectUpdate, SubjectWithStats

logger = structlog.get_logger()

router = APIRouter()


@router.post("/", response_model=Subject, status_code=status.HTTP_201_CREATED)
async def create_subject(
    subject_data: SubjectCreate,
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new subject (requires tutor authentication)"""
    try:
        subject_service = SubjectService(database)
        # Pass tutor_id for tenant isolation
        subject = await subject_service.create_subject(subject_data, tutor_id=current_user.clerk_id)
        return subject
    except Exception as e:
        logger.error("Failed to create subject", error=str(e), tutor_id=current_user.clerk_id)
        raise HTTPException(status_code=500, detail="Failed to create subject")


@router.get("/", response_model=List[Subject])
async def get_subjects(
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all subjects for the authenticated tutor"""
    try:
        # Filter subjects by tutor_id for tenant isolation
        cursor = database.subjects.find({"tutor_id": current_user.clerk_id})
        subjects_data = await cursor.to_list(length=None)

        # Convert to Subject models with proper field mapping
        subjects = []
        for subject_data in subjects_data:
            # Convert ObjectId to string for the id field
            subject_data["id"] = str(subject_data.pop("_id"))

            # Ensure all required fields are present
            if "tenant_id" not in subject_data:
                subject_data["tenant_id"] = current_user.tutor_id or current_user.clerk_id
            if "question_count" not in subject_data:
                subject_data["question_count"] = 0
            if "is_active" not in subject_data:
                subject_data["is_active"] = True

            subjects.append(Subject(**subject_data))

        return subjects
    except Exception as e:
        logger.error("Failed to get subjects", error=str(e), tutor_id=current_user.clerk_id)
        raise HTTPException(status_code=500, detail="Failed to retrieve subjects")


@router.get("/{subject_id}", response_model=Subject)
async def get_subject(
    subject_id: str = Path(..., description="Subject ID"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get subject by ID (only if owned by authenticated tutor)"""
    try:
        subject_service = SubjectService(database)
        subject = await subject_service.get_subject_by_id(subject_id, tutor_id=current_user.clerk_id)
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        return subject
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get subject", error=str(e), tutor_id=current_user.clerk_id)
        raise HTTPException(status_code=500, detail="Failed to retrieve subject")


@router.get("/{subject_id}/stats", response_model=SubjectWithStats)
async def get_subject_with_stats(
    subject_id: str = Path(..., description="Subject ID"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get subject with statistics (only if owned by authenticated tutor)"""
    try:
        subject_service = SubjectService(database)
        subject_stats = await subject_service.get_subject_with_stats(subject_id, tutor_id=current_user.clerk_id)
        if not subject_stats:
            raise HTTPException(status_code=404, detail="Subject not found")
        return subject_stats
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get subject stats", error=str(e), tutor_id=current_user.clerk_id)
        raise HTTPException(status_code=500, detail="Failed to retrieve subject statistics")


@router.put("/{subject_id}", response_model=Subject)
async def update_subject(
    subject_update: SubjectUpdate,
    subject_id: str = Path(..., description="Subject ID"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update subject (only if owned by authenticated tutor)"""
    try:
        subject_service = SubjectService(database)
        subject = await subject_service.update_subject(subject_id, subject_update, tutor_id=current_user.clerk_id)
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found or access denied")
        return subject
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update subject", error=str(e), tutor_id=current_user.clerk_id)
        raise HTTPException(status_code=500, detail="Failed to update subject")


@router.delete("/{subject_id}")
async def delete_subject(
    subject_id: str = Path(..., description="Subject ID"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete subject (only if owned by authenticated tutor)"""
    try:
        subject_service = SubjectService(database)
        deleted = await subject_service.delete_subject(subject_id, tutor_id=current_user.clerk_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Subject not found or access denied")
        return {"message": "Subject deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete subject", error=str(e), tutor_id=current_user.clerk_id)
        raise HTTPException(status_code=500, detail="Failed to delete subject")


@router.post("/{subject_id}/topics/{topic}")
async def add_topic_to_subject(
    subject_id: str = Path(..., description="Subject ID"),
    topic: str = Path(..., description="Topic name"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Add topic to subject (only if owned by authenticated tutor)"""
    try:
        subject_service = SubjectService(database)
        subject = await subject_service.add_topic_to_subject(subject_id, topic, tutor_id=current_user.clerk_id)
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found or access denied")
        return {"message": f"Topic '{topic}' added successfully", "subject": subject}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to add topic", error=str(e), tutor_id=current_user.clerk_id)
        raise HTTPException(status_code=500, detail="Failed to add topic")


@router.delete("/{subject_id}/topics/{topic}")
async def remove_topic_from_subject(
    subject_id: str = Path(..., description="Subject ID"),
    topic: str = Path(..., description="Topic name"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Remove topic from subject (only if owned by authenticated tutor)"""
    try:
        subject_service = SubjectService(database)
        subject = await subject_service.remove_topic_from_subject(subject_id, topic, tutor_id=current_user.clerk_id)
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found or access denied")
        return {"message": f"Topic '{topic}' removed successfully", "subject": subject}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to remove topic", error=str(e), tutor_id=current_user.clerk_id)
        raise HTTPException(status_code=500, detail="Failed to remove topic")
