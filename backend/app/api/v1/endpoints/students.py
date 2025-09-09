"""
Student management endpoints, now operating on the unified 'users' collection.
A "student" is a user with the role 'student'.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog

from app.core.database import get_database
from app.core.enhanced_auth import require_tutor, ClerkUserContext
from app.models.user import User, UserCreate, UserUpdate, UserRole
from app.services.user_service import UserService

logger = structlog.get_logger()
router = APIRouter()

# Mock tutor for development without real auth
MOCK_TUTOR_ID = "user_2j5d1oZaP8cE7b6aF4gH3i2kL1m"

@router.get("/", response_model=List[User])
async def list_students_for_tutor(
    limit: int = Query(200, ge=1, le=500),
    current_user: ClerkUserContext = Depends(require_tutor),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get all students assigned to the currently authenticated tutor.
    """
    try:
        user_service = UserService(db)
        students = await user_service.get_students_for_tutor(current_user.clerk_id, limit)
        return students
    except Exception as e:
        logger.error("Failed to list students for tutor", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve students")

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_student_for_tutor(
    payload: UserCreate,
    # current_user: ClerkUserContext = Depends(require_tutor), # Uncomment when auth is ready
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Create a new student and assign them to the current tutor.
    """
    try:
        user_service = UserService(db)
        
        # Ensure the role is 'student' and assign tutor_id
        payload.role = UserRole.STUDENT
        # payload.tutor_id = current_user.clerk_id
        payload.tutor_id = MOCK_TUTOR_ID

        student = await user_service.create_user(payload)
        return student
    except Exception as e:
        logger.error("Failed to create student", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create student")

@router.get("/{student_clerk_id}", response_model=User)
async def get_student(
    student_clerk_id: str,
    # current_user: ClerkUserContext = Depends(require_tutor), # Uncomment when auth is ready
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get a specific student, ensuring they belong to the current tutor.
    """
    try:
        user_service = UserService(db)
        student = await user_service.get_by_clerk_id(student_clerk_id)
        
        if not student or student.role != UserRole.STUDENT:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Security Check: Ensure the student belongs to the requesting tutor
        # if student.tutor_id != current_user.clerk_id:
        if student.tutor_id != MOCK_TUTOR_ID:
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
    # current_user: ClerkUserContext = Depends(require_tutor), # Uncomment when auth is ready
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Update a student's profile, ensuring they belong to the current tutor.
    """
    try:
        user_service = UserService(db)
        # First, verify the student exists and belongs to the tutor
        await get_student(student_clerk_id, db) # Uses the mock tutor ID for now

        # Prevent role changes via this endpoint
        if payload.role and payload.role != UserRole.STUDENT:
            raise HTTPException(status_code=400, detail="Cannot change user role via this endpoint.")

        updated_student = await user_service.update_user(student_clerk_id, payload)
        return updated_student
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update student", student_clerk_id=student_clerk_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update student")

