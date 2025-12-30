"""
Activity tracking endpoints with tenant isolation
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Path, Query, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog

from app.core.database import get_database
from app.core.enhanced_auth import require_authenticated_user, require_tutor, ClerkUserContext, UserRole
from app.models.activity import Activity, ActivityCreate, StudentActivitySummary
from app.services.activity_service import ActivityService
from app.utils.pagination import PaginationParams, PaginatedResponse, paginate

logger = structlog.get_logger()
router = APIRouter()


@router.get("/student/{student_id}", response_model=PaginatedResponse[StudentActivitySummary])
async def get_student_activities(
    student_id: str = Path(..., description="Student ID"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: ClerkUserContext = Depends(require_authenticated_user),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get paginated activity summary for a student (with tenant isolation)"""
    try:
        # Role-based access control for tenant isolation
        if current_user.role == UserRole.TUTOR:
            # Tutors can only view activities for their students
            student = await database.students.find_one({
                "clerk_id": student_id,
                "tutor_id": current_user.clerk_id
            })
            if not student:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Student does not belong to your tenant"
                )
        elif current_user.role == UserRole.STUDENT:
            # Students can only view their own activities
            if student_id != current_user.clerk_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You can only view your own activities"
                )
        elif current_user.role == UserRole.PARENT:
            # Parents can only view their children's activities
            if student_id not in (current_user.student_ids or []):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Student is not your child"
                )

        activity_service = ActivityService(database)

        # Create pagination params
        pagination = PaginationParams(page=page, per_page=per_page)

        # Get total count
        total = await activity_service.get_student_activities_count(student_id)

        # Get paginated activities
        activities = await activity_service.get_student_activity_summary_paginated(
            student_id=student_id,
            skip=pagination.skip,
            limit=pagination.limit
        )

        # Return paginated response
        return paginate(
            items=activities,
            page=page,
            per_page=per_page,
            total=total
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get student activities", error=str(e), student_id=student_id)
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
    """Get recent activities for tutor's students (tenant isolated)"""
    try:
        activity_service = ActivityService(database)
        # Use clerk_id for tenant isolation (tutor_id is the tutor's clerk_id)
        activities = await activity_service.get_recent_activities(
            tutor_id=current_user.clerk_id,
            days=days,
            limit=limit
        )
        return activities
    except Exception as e:
        logger.error("Failed to get recent activities", error=str(e), tutor_id=current_user.clerk_id)
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
        logger.error("Failed to get user activities", error=str(e), user_id=current_user.clerk_id)
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
    """Create a new activity record (with tenant isolation)"""
    try:
        activity_service = ActivityService(database)

        # Determine tutor_id based on user role for tenant isolation
        tutor_id = None
        if current_user.role == UserRole.TUTOR:
            tutor_id = current_user.clerk_id
        elif current_user.tutor_id:
            tutor_id = current_user.tutor_id

        # Create activity with tutor_id for tenant isolation
        activity = await activity_service.create_activity(
            activity_data=activity_data,
            user_id=current_user.clerk_id,
            tutor_id=tutor_id
        )
        return activity
    except Exception as e:
        logger.error("Failed to create activity", error=str(e), user_id=current_user.clerk_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create activity"
        )

