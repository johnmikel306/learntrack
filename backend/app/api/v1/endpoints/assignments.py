"""
Assignment management endpoints
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Path, Query, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog

from app.core.database import get_database
from app.models.assignment import Assignment, AssignmentCreate, AssignmentUpdate
from app.services.assignment_service import AssignmentService
from app.services.user_service import UserService

logger = structlog.get_logger()
router = APIRouter()

@router.post("/", response_model=Assignment)
async def create_assignment(
    assignment_data: AssignmentCreate,
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new assignment (tutor only)"""
    try:
        assignment_service = AssignmentService(database)
        assignment = await assignment_service.create_assignment(assignment_data, "default_tutor")
        return assignment
    except Exception as e:
        logger.error("Failed to create assignment", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create assignment")

@router.get("/")
async def get_assignments(
    subject_id: Optional[str] = Query(None, description="Filter by subject ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get assignments for current user (tutor only)"""
    try:
        # For development, get assignments directly from database
        query = {}
        if subject_id:
            query["subject"] = subject_id
        if status:
            query["status"] = status

        cursor = database.assignments.find(query)
        assignments_data = await cursor.to_list(length=None)

        # Return simplified assignment data without strict model validation
        assignments = []
        for assignment_data in assignments_data:
            # Convert ObjectId to string for JSON serialization
            assignment_data["id"] = str(assignment_data.pop("_id"))

            # Convert ObjectId fields to strings
            if "created_by" in assignment_data:
                assignment_data["created_by"] = str(assignment_data["created_by"])
            if "assigned_to" in assignment_data:
                assignment_data["assigned_to"] = [str(sid) for sid in assignment_data["assigned_to"]]
            if "questions" in assignment_data:
                for question in assignment_data["questions"]:
                    if "question_id" in question:
                        question["question_id"] = str(question["question_id"])

            assignments.append(assignment_data)

        return assignments
    except Exception as e:
        logger.error("Failed to get assignments", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get assignments")

@router.get("/{assignment_id}", response_model=Assignment)
async def get_assignment(
    assignment_id: str = Path(..., description="Assignment ID"),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get assignment by ID"""
    try:
        assignment_service = AssignmentService(database)
        assignment = await assignment_service.get_assignment_by_id(assignment_id)
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
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update assignment"""
    try:
        assignment_service = AssignmentService(database)
        assignment = await assignment_service.update_assignment(assignment_id, assignment_update)
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
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete assignment"""
    try:
        assignment_service = AssignmentService(database)
        success = await assignment_service.delete_assignment(assignment_id)
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
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get assignments for a specific student"""
    try:
        assignment_service = AssignmentService(database)
        assignments = await assignment_service.get_assignments_for_student(
            student_id=student_id,
            status=status
        )
        return assignments
    except Exception as e:
        logger.error("Failed to get student assignments", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get student assignments")
