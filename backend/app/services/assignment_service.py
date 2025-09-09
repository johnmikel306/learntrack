"""
Assignment service for database operations
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog

from app.models.assignment import (
    Assignment, AssignmentCreate, AssignmentUpdate, AssignmentInDB,
    AssignmentForStudent, AssignmentStatus, QuestionAssignment
)
from app.core.exceptions import NotFoundError, DatabaseException
from app.core.utils import to_object_id

logger = structlog.get_logger()


class AssignmentService:
    """Assignment service for database operations"""
    
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.collection = database.assignments
    
    async def create_assignment(self, assignment_data: AssignmentCreate, tutor_id: str) -> Assignment:
        """Create a new assignment"""
        try:
            # Create assignment document
            assignment_dict = assignment_data.dict()
            assignment_dict["tutor_id"] = tutor_id
            assignment_dict["created_at"] = datetime.utcnow()
            assignment_dict["updated_at"] = datetime.utcnow()
            assignment_dict["status"] = AssignmentStatus.SCHEDULED
            assignment_dict["questions"] = []  # Will be populated later
            assignment_dict["student_ids"] = assignment_data.student_ids or []
            
            result = await self.collection.insert_one(assignment_dict)
            assignment_dict["_id"] = result.inserted_id
            
            logger.info("Assignment created", assignment_id=str(result.inserted_id))
            return Assignment(**assignment_dict)
            
        except Exception as e:
            logger.error("Failed to create assignment", error=str(e))
            raise DatabaseException(f"Failed to create assignment: {str(e)}")
    
    async def get_assignment_by_id(self, assignment_id: str) -> Assignment:
        """Get assignment by ID"""
        try:
            oid = to_object_id(assignment_id)
            assignment = await self.collection.find_one({"_id": oid})
            if not assignment:
                raise NotFoundError("Assignment", assignment_id)
            return Assignment(**assignment)
        except NotFoundError:
            raise
        except Exception as e:
            logger.error("Failed to get assignment", assignment_id=assignment_id, error=str(e))
            raise DatabaseException(f"Failed to get assignment: {str(e)}")
    
    async def get_assignments_for_tutor(self, tutor_id: str, subject_id: Optional[str] = None, 
                                       status: Optional[str] = None) -> List[Assignment]:
        """Get assignments created by a tutor"""
        try:
            query = {"tutor_id": tutor_id}
            
            if subject_id:
                query["subject_id"] = subject_id
            if status:
                query["status"] = status
            
            cursor = self.collection.find(query).sort("created_at", -1)
            assignments = []
            
            async for assignment in cursor:
                assignments.append(Assignment(**assignment))
            
            return assignments
            
        except Exception as e:
            logger.error("Failed to get tutor assignments", tutor_id=tutor_id, error=str(e))
            raise DatabaseException(f"Failed to get assignments: {str(e)}")
    
    async def get_assignments_for_student(self, student_id: str) -> List[AssignmentForStudent]:
        """Get assignments assigned to a student"""
        try:
            query = {"student_ids": student_id}
            cursor = self.collection.find(query).sort("due_date", 1)
            assignments = []
            
            async for assignment in cursor:
                # Convert to student view
                student_assignment = AssignmentForStudent(
                    id=str(assignment["_id"]),
                    title=assignment["title"],
                    description=assignment.get("description"),
                    subject_id=assignment["subject_id"],
                    topic=assignment["topic"],
                    assignment_type=assignment["assignment_type"],
                    due_date=assignment["due_date"],
                    time_limit=assignment.get("time_limit"),
                    max_attempts=assignment["max_attempts"],
                    shuffle_questions=assignment["shuffle_questions"],
                    show_results_immediately=assignment["show_results_immediately"],
                    status=assignment["status"],
                    question_count=len(assignment.get("questions", [])),
                    attempts_used=0,  # Would come from progress tracking
                    last_attempt_score=None,  # Would come from progress tracking
                    is_overdue=assignment["due_date"] < datetime.utcnow() if assignment.get("due_date") else False
                )
                assignments.append(student_assignment)
            
            return assignments
            
        except Exception as e:
            logger.error("Failed to get student assignments", student_id=student_id, error=str(e))
            raise DatabaseException(f"Failed to get assignments: {str(e)}")
    
    async def update_assignment(self, assignment_id: str, assignment_update: AssignmentUpdate) -> Assignment:
        """Update assignment"""
        try:
            update_data = assignment_update.dict(exclude_unset=True)
            if not update_data:
                return await self.get_assignment_by_id(assignment_id)
            
            update_data["updated_at"] = datetime.utcnow()
            
            oid = to_object_id(assignment_id)
            result = await self.collection.update_one(
                {"_id": oid},
                {"$set": update_data}
            )
            
            if result.matched_count == 0:
                raise NotFoundError("Assignment", assignment_id)
            
            logger.info("Assignment updated", assignment_id=assignment_id)
            return await self.get_assignment_by_id(assignment_id)
            
        except NotFoundError:
            raise
        except Exception as e:
            logger.error("Failed to update assignment", assignment_id=assignment_id, error=str(e))
            raise DatabaseException(f"Failed to update assignment: {str(e)}")
    
    async def delete_assignment(self, assignment_id: str) -> bool:
        """Delete assignment (soft delete)"""
        try:
            oid = to_object_id(assignment_id)
            result = await self.collection.update_one(
                {"_id": oid},
                {"$set": {"status": AssignmentStatus.ARCHIVED, "updated_at": datetime.utcnow()}}
            )
            
            if result.matched_count == 0:
                raise NotFoundError("Assignment", assignment_id)
            
            logger.info("Assignment deleted", assignment_id=assignment_id)
            return True
            
        except NotFoundError:
            raise
        except Exception as e:
            logger.error("Failed to delete assignment", assignment_id=assignment_id, error=str(e))
            raise DatabaseException(f"Failed to delete assignment: {str(e)}")
    
    async def add_questions_to_assignment(self, assignment_id: str, question_ids: List[str]) -> Assignment:
        """Add questions to an assignment"""
        try:
            questions = [QuestionAssignment(question_id=qid, order=i) for i, qid in enumerate(question_ids)]
            question_dicts = [q.dict() for q in questions]
            
            oid = to_object_id(assignment_id)
            result = await self.collection.update_one(
                {"_id": oid},
                {
                    "$set": {
                        "questions": question_dicts,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            if result.matched_count == 0:
                raise NotFoundError("Assignment", assignment_id)
            
            logger.info("Questions added to assignment", assignment_id=assignment_id, question_count=len(question_ids))
            return await self.get_assignment_by_id(assignment_id)
            
        except NotFoundError:
            raise
        except Exception as e:
            logger.error("Failed to add questions to assignment", assignment_id=assignment_id, error=str(e))
            raise DatabaseException(f"Failed to add questions: {str(e)}")
    
    async def assign_to_students(self, assignment_id: str, student_ids: List[str]) -> Assignment:
        """Assign assignment to students"""
        try:
            oid = to_object_id(assignment_id)
            result = await self.collection.update_one(
                {"_id": oid},
                {
                    "$addToSet": {"student_ids": {"$each": student_ids}},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            
            if result.matched_count == 0:
                raise NotFoundError("Assignment", assignment_id)
            
            logger.info("Assignment assigned to students", assignment_id=assignment_id, student_count=len(student_ids))
            return await self.get_assignment_by_id(assignment_id)
            
        except NotFoundError:
            raise
        except Exception as e:
            logger.error("Failed to assign to students", assignment_id=assignment_id, error=str(e))
            raise DatabaseException(f"Failed to assign to students: {str(e)}")
