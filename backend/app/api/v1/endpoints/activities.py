"""
Activity tracking endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Path, Query, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog

from app.core.database import get_database
from app.core.enhanced_auth import require_authenticated_user, require_tutor, ClerkUserContext
from app.models.activity import Activity, ActivityCreate, StudentActivitySummary
from app.services.activity_service import ActivityService

logger = structlog.get_logger()
router = APIRouter()


@router.get("/student/{student_id}", response_model=List[StudentActivitySummary])
async def get_student_activities(
    student_id: str = Path(..., description="Student ID"),
    limit: int = Query(10, description="Maximum number of activities to return"),
    current_user: ClerkUserContext = Depends(require_authenticated_user),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get activity summary for a student"""
    try:
        activity_service = ActivityService(database)
        activities = await activity_service.get_student_activity_summary(
            student_id=student_id,
            limit=limit
        )
        return activities
    except Exception as e:
        logger.error("Failed to get student activities", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve student activities"
        )


@router.get("/recent", response_model=List[Activity])
async def get_recent_activities(
    days: int = Query(7, description="Number of days to look back"),
    limit: int = Query(100, description="Maximum number of activities to return"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get recent activities for tutor's students"""
    try:
        activity_service = ActivityService(database)
        activities = await activity_service.get_recent_activities(
            tutor_id=current_user.tutor_id,
            days=days,
            limit=limit
        )
        return activities
    except Exception as e:
        logger.error("Failed to get recent activities", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve recent activities"
        )


@router.get("/me", response_model=List[Activity])
async def get_my_activities(
    limit: int = Query(50, description="Maximum number of activities to return"),
    current_user: ClerkUserContext = Depends(require_authenticated_user),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get activities for current user"""
    try:
        activity_service = ActivityService(database)
        activities = await activity_service.get_user_activities(
            user_id=current_user.clerk_id,
            limit=limit
        )
        return activities
    except Exception as e:
        logger.error("Failed to get user activities", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve activities"
        )


@router.post("/", response_model=Activity)
async def create_activity(
    activity_data: ActivityCreate,
    current_user: ClerkUserContext = Depends(require_authenticated_user),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new activity record"""
    try:
        activity_service = ActivityService(database)
        activity = await activity_service.create_activity(activity_data)
        return activity
    except Exception as e:
        logger.error("Failed to create activity", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create activity"
        )

