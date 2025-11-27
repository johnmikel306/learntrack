"""
Student management endpoints, operating on the role-specific "students" collection.
A "student" is a user with the role "student".
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog

from app.core.database import get_database
from app.core.enhanced_auth import require_tutor, ClerkUserContext
from app.models.user import User, UserCreate, UserUpdate, UserRole
from app.services.user_service import UserService
from app.utils.pagination import PaginationParams, PaginatedResponse, paginate

logger = structlog.get_logger()
router = APIRouter()

@router.get("/", response_model=PaginatedResponse[User])
async def list_students_for_tutor(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: ClerkUserContext = Depends(require_tutor),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get paginated students assigned to the currently authenticated tutor.
    """
    try:
        user_service = UserService(db)

        # Create pagination params
        pagination = PaginationParams(page=page, per_page=per_page)

        # Get total count
        total = await user_service.get_students_count_for_tutor(current_user.clerk_id)

        # Get paginated students
        students = await user_service.get_students_for_tutor_paginated(
            tutor_id=current_user.clerk_id,
            skip=pagination.skip,
            limit=pagination.limit
        )

        # Return paginated response
        return paginate(
            items=students,
            page=page,
            per_page=per_page,
            total=total
        )
    except Exception as e:
        logger.error("Failed to list students for tutor", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve students")

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_student_for_tutor(
    payload: UserCreate,
    current_user: ClerkUserContext = Depends(require_tutor),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Create a new student and assign them to the current tutor.
    """
    try:
        user_service = UserService(db)
        
        # Ensure the role is 'student' and assign tutor_id
        payload.role = UserRole.STUDENT
        payload.tutor_id = current_user.clerk_id

        student = await user_service.create_user(payload)
        return student
    except Exception as e:
        logger.error("Failed to create student", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create student")

@router.get("/by-slug/{slug}", response_model=User)
async def get_student_by_slug(
    slug: str,
    current_user: ClerkUserContext = Depends(require_tutor),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get a specific student by slug, ensuring they belong to the current tutor.
    """
    try:
        user_service = UserService(db)
        student = await user_service.get_user_by_slug(slug)

        if not student or student.role != UserRole.STUDENT:
            raise HTTPException(status_code=404, detail="Student not found")

        # Security Check: Ensure the student belongs to the requesting tutor
        if student.tutor_id != current_user.clerk_id:
            raise HTTPException(status_code=403, detail="Access forbidden: Student does not belong to this tutor.")

        return student
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get student by slug", slug=slug, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve student")

@router.get("/{student_clerk_id}", response_model=User)
async def get_student(
    student_clerk_id: str,
    current_user: ClerkUserContext = Depends(require_tutor),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get a specific student, ensuring they belong to the current tutor.
    """
    try:
        user_service = UserService(db)
        student = await user_service.get_user_by_clerk_id(student_clerk_id)

        if not student or student.role != UserRole.STUDENT:
            raise HTTPException(status_code=404, detail="Student not found")

        # Security Check: Ensure the student belongs to the requesting tutor
        if student.tutor_id != current_user.clerk_id:
            raise HTTPException(status_code=403, detail="Access forbidden: Student does not belong to this tutor.")

        return student
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get student", student_clerk_id=student_clerk_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve student")

@router.put("/{student_clerk_id}", response_model=User)
async def update_student(
    student_clerk_id: str,
    payload: UserUpdate,
    current_user: ClerkUserContext = Depends(require_tutor),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Update a student's profile, ensuring they belong to the current tutor.
    """
    try:
        user_service = UserService(db)
        # First, verify the student exists and belongs to the tutor
        student_to_update = await user_service.get_user_by_clerk_id(student_clerk_id)
        if not student_to_update or student_to_update.role != UserRole.STUDENT:
            raise HTTPException(status_code=404, detail="Student not found")
        
        if student_to_update.tutor_id != current_user.clerk_id:
            raise HTTPException(status_code=403, detail="Access forbidden: Student does not belong to this tutor.")

        # Prevent role changes via this endpoint
        if hasattr(payload, 'role') and payload.role and payload.role != UserRole.STUDENT:
            raise HTTPException(status_code=400, detail="Cannot change user role via this endpoint.")

        updated_student = await user_service.update_user(student_to_update.id, payload)
        return updated_student
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update student", student_clerk_id=student_clerk_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update student")


@router.delete("/{student_clerk_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_clerk_id: str,
    current_user: ClerkUserContext = Depends(require_tutor),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Delete a student, ensuring they belong to the current tutor.
    """
    try:
        user_service = UserService(db)

        # First, verify the student exists and belongs to the tutor
        student = await user_service.get_user_by_clerk_id(student_clerk_id)
        if not student or student.role != UserRole.STUDENT:
            raise HTTPException(status_code=404, detail="Student not found")

        if student.tutor_id != current_user.clerk_id:
            raise HTTPException(status_code=403, detail="Access forbidden: Student does not belong to this tutor.")

        # Delete the student
        await user_service.delete_user(student.id)
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete student", student_clerk_id=student_clerk_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to delete student")

