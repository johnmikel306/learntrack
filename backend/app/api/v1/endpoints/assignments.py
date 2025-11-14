"""
Assignment management endpoints
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Path, Query, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog

from app.core.database import get_database
from app.core.enhanced_auth import require_tutor, require_authenticated_user, ClerkUserContext
from app.models.assignment import Assignment, AssignmentCreate, AssignmentUpdate
from app.services.assignment_service import AssignmentService
from app.services.user_service import UserService
from app.utils.pagination import PaginationParams, PaginatedResponse, paginate

logger = structlog.get_logger()
router = APIRouter()

@router.post("/", response_model=Assignment)
async def create_assignment(
    assignment_data: AssignmentCreate,
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new assignment (tutor only)"""
    try:
        assignment_service = AssignmentService(database)
        assignment = await assignment_service.create_assignment(assignment_data, current_user.clerk_id)
        return assignment
    except Exception as e:
        logger.error("Failed to create assignment", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create assignment")

@router.get("/")
async def get_assignments(
    subject_id: Optional[str] = Query(None, description="Filter by subject ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get assignments for current user (tutor only)"""
    try:
        assignment_service = AssignmentService(database)
        assignments = await assignment_service.get_assignments_for_tutor(
            tutor_id=current_user.clerk_id,
            subject_id=subject_id,
            status=status
        )
        return assignments
    except Exception as e:
        logger.error("Failed to get assignments", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get assignments")

@router.get("/student/{student_id}", response_model=PaginatedResponse[Assignment])
async def get_student_assignments(
    student_id: str = Path(..., description="Student ID"),
    status: Optional[str] = Query(None, description="Filter by status (pending, completed, etc.)"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: ClerkUserContext = Depends(require_authenticated_user),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get paginated assignments for a specific student"""
    try:
        assignment_service = AssignmentService(database)

        # Create pagination params
        pagination = PaginationParams(page=page, per_page=per_page)

        # Get total count
        total = await assignment_service.get_student_assignments_count(
            student_id=student_id,
            tutor_id=current_user.tutor_id,
            status=status
        )

        # Get paginated assignments
        assignments = await assignment_service.get_student_assignments_paginated(
            student_id=student_id,
            tutor_id=current_user.tutor_id,
            status=status,
            skip=pagination.skip,
            limit=pagination.limit
        )

        # Return paginated response
        return paginate(
            items=assignments,
            page=page,
            per_page=per_page,
            total=total
        )
    except Exception as e:
        logger.error("Failed to get student assignments", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get student assignments")

@router.get("/{assignment_id}", response_model=Assignment)
async def get_assignment(
    assignment_id: str = Path(..., description="Assignment ID"),
    current_user: ClerkUserContext = Depends(require_authenticated_user),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get assignment by ID"""
    try:
        assignment_service = AssignmentService(database)
        assignment = await assignment_service.get_assignment_by_id(assignment_id, current_user)
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")
        return assignment
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get assignment", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get assignment")

@router.put("/{assignment_id}", response_model=Assignment)
async def update_assignment(
    assignment_update: AssignmentUpdate,
    assignment_id: str = Path(..., description="Assignment ID"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update assignment"""
    try:
        assignment_service = AssignmentService(database)
        assignment = await assignment_service.update_assignment(assignment_id, assignment_update, current_user.clerk_id)
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")
        return assignment
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update assignment", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update assignment")

@router.delete("/{assignment_id}")
async def delete_assignment(
    assignment_id: str = Path(..., description="Assignment ID"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete assignment"""
    try:
        assignment_service = AssignmentService(database)
        success = await assignment_service.delete_assignment(assignment_id, current_user.clerk_id)
        if not success:
            raise HTTPException(status_code=404, detail="Assignment not found")
        return {"message": "Assignment deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete assignment", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to delete assignment")

@router.get("/student/{student_id}", response_model=List[Assignment])
async def get_student_assignments(
    student_id: str = Path(..., description="Student ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user: ClerkUserContext = Depends(require_authenticated_user),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get assignments for a specific student"""
    try:
        # Security check: ensure the current user can view this student's assignments
        if current_user.role == "student" and current_user.clerk_id != student_id:
            raise HTTPException(status_code=403, detail="Forbidden")
        
        assignment_service = AssignmentService(database)
        assignments = await assignment_service.get_assignments_for_student(
            student_id=student_id,
            status=status,
            current_user=current_user
        )
        return assignments
    except Exception as e:
        logger.error("Failed to get student assignments", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get student assignments")


@router.post("/{assignment_id}/assign-to-group", response_model=Assignment)
async def assign_to_group(
    assignment_id: str = Path(..., description="Assignment ID"),
    group_id: str = Query(..., description="Group ID to assign to"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Assign an assignment to a student group"""
    try:
        assignment_service = AssignmentService(database)
        assignment = await assignment_service.assign_to_group(assignment_id, group_id)
        return assignment
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to assign to group", assignment_id=assignment_id, group_id=group_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{assignment_id}/group-performance/{group_id}")
async def get_group_performance(
    assignment_id: str = Path(..., description="Assignment ID"),
    group_id: str = Path(..., description="Group ID"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get performance statistics for a specific group on an assignment"""
    try:
        assignment_service = AssignmentService(database)
        performance = await assignment_service.get_group_performance(assignment_id, group_id)
        return performance
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get group performance", assignment_id=assignment_id, group_id=group_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
