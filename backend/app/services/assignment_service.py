"""
Assignment service for database operations
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog
import os

from app.models.assignment import (
    Assignment, AssignmentCreate, AssignmentUpdate, AssignmentInDB,
    AssignmentForStudent, AssignmentStatus, QuestionAssignment
)
from app.core.exceptions import NotFoundError, DatabaseException, ValidationError
from app.core.utils import to_object_id
from app.services.email_service import email_service

logger = structlog.get_logger()

# Get frontend URL from environment
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


class AssignmentService:
    """Assignment service for database operations"""
    
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.collection = database.assignments
    
    async def create_assignment(self, assignment_data: AssignmentCreate, tutor_id: str) -> Assignment:
        """Create a new assignment with support for groups and subject-based assignment"""
        try:
            # Resolve student IDs from groups and subject filters
            student_ids = set(assignment_data.student_ids or [])
            group_ids = assignment_data.group_ids or []

            # Add students from groups
            if group_ids:
                for group_id in group_ids:
                    group_students = await self._get_students_from_group(group_id)
                    student_ids.update(group_students)

            # Add students from subject filter
            if assignment_data.subject_filter:
                subject_students = await self._get_students_by_subject(
                    tutor_id,
                    assignment_data.subject_filter
                )
                student_ids.update(subject_students)

            # Create assignment document
            assignment_dict = assignment_data.dict(exclude={'group_ids', 'subject_filter'})
            assignment_dict["tutor_id"] = tutor_id
            assignment_dict["created_at"] = datetime.utcnow()
            assignment_dict["updated_at"] = datetime.utcnow()
            assignment_dict["status"] = AssignmentStatus.SCHEDULED
            assignment_dict["questions"] = []  # Will be populated later
            assignment_dict["student_ids"] = list(student_ids)
            assignment_dict["group_ids"] = group_ids
            assignment_dict["assigned_via_subject"] = assignment_data.subject_filter
            assignment_dict["is_group_assignment"] = bool(group_ids or assignment_data.subject_filter)
            assignment_dict["group_completion_rates"] = {}
            assignment_dict["group_average_scores"] = {}

            result = await self.collection.insert_one(assignment_dict)
            assignment_dict["_id"] = result.inserted_id

            logger.info(
                "Assignment created",
                assignment_id=str(result.inserted_id),
                student_count=len(student_ids),
                group_count=len(group_ids),
                is_group_assignment=assignment_dict["is_group_assignment"]
            )

            # Send email notifications to students
            try:
                # Get tutor info
                tutor = await self.db.users.find_one({"clerk_id": tutor_id})
                tutor_name = tutor.get("name", "Your Teacher") if tutor else "Your Teacher"

                assignment_link = f"{FRONTEND_URL}/assignments/{str(result.inserted_id)}"

                # Send to each student
                for student_id in student_ids:
                    try:
                        student = await self.db.users.find_one({"clerk_id": student_id})
                        if student and student.get("email"):
                            email_service.send_assignment_notification(
                                to_email=student["email"],
                                to_name=student.get("name", "Student"),
                                assignment_title=assignment_data.title,
                                teacher_name=tutor_name,
                                due_date=assignment_data.due_date,
                                assignment_link=assignment_link
                            )
                    except Exception as e:
                        logger.warning(
                            "Failed to send assignment notification",
                            student_id=student_id,
                            error=str(e)
                        )
            except Exception as e:
                logger.warning(
                    "Failed to send assignment notifications",
                    error=str(e)
                )

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

    async def assign_to_group(self, assignment_id: str, group_id: str) -> Assignment:
        """Assign assignment to a student group"""
        try:
            # Get students from group
            group_students = await self._get_students_from_group(group_id)

            if not group_students:
                raise ValidationError(f"Group {group_id} has no students")

            # Update assignment
            oid = to_object_id(assignment_id)
            result = await self.collection.update_one(
                {"_id": oid},
                {
                    "$addToSet": {
                        "student_ids": {"$each": list(group_students)},
                        "group_ids": group_id
                    },
                    "$set": {
                        "is_group_assignment": True,
                        "updated_at": datetime.utcnow()
                    }
                }
            )

            if result.matched_count == 0:
                raise NotFoundError("Assignment", assignment_id)

            logger.info("Assignment assigned to group", assignment_id=assignment_id, group_id=group_id, student_count=len(group_students))
            return await self.get_assignment_by_id(assignment_id)

        except (NotFoundError, ValidationError):
            raise
        except Exception as e:
            logger.error("Failed to assign to group", assignment_id=assignment_id, error=str(e))
            raise DatabaseException(f"Failed to assign to group: {str(e)}")

    async def get_group_performance(self, assignment_id: str, group_id: str) -> Dict:
        """Get performance statistics for a specific group on an assignment"""
        try:
            assignment = await self.get_assignment_by_id(assignment_id)
            group_students = await self._get_students_from_group(group_id)

            # Get progress for group students
            progress_collection = self.database.progress
            group_progress = await progress_collection.find({
                "assignment_id": assignment_id,
                "student_id": {"$in": list(group_students)}
            }).to_list(length=None)

            # Calculate statistics
            total_students = len(group_students)
            completed = sum(1 for p in group_progress if p.get("status") == "completed")
            scores = [p.get("score", 0) for p in group_progress if p.get("score") is not None]

            return {
                "group_id": group_id,
                "assignment_id": assignment_id,
                "total_students": total_students,
                "completed_count": completed,
                "completion_rate": (completed / total_students * 100) if total_students > 0 else 0,
                "average_score": sum(scores) / len(scores) if scores else 0,
                "highest_score": max(scores) if scores else 0,
                "lowest_score": min(scores) if scores else 0
            }

        except NotFoundError:
            raise
        except Exception as e:
            logger.error("Failed to get group performance", assignment_id=assignment_id, group_id=group_id, error=str(e))
            raise DatabaseException(f"Failed to get group performance: {str(e)}")

    async def _get_students_from_group(self, group_id: str) -> List[str]:
        """Helper: Get student IDs from a group"""
        try:
            from app.core.exceptions import NotFoundError as NF
            oid = to_object_id(group_id)
            group = await self.database.student_groups.find_one({"_id": oid})

            if not group:
                raise NF("StudentGroup", group_id)

            return group.get("studentIds", [])

        except Exception as e:
            logger.error("Failed to get students from group", group_id=group_id, error=str(e))
            return []

    async def _get_students_by_subject(self, tutor_id: str, subject_id: str) -> List[str]:
        """Helper: Get student IDs enrolled in a subject"""
        try:
            # Get all groups for this subject
            groups = await self.database.student_groups.find({
                "tutor_id": tutor_id,
                "subjects": subject_id
            }).to_list(length=None)

            # Collect unique student IDs
            student_ids = set()
            for group in groups:
                student_ids.update(group.get("studentIds", []))

            return list(student_ids)

        except Exception as e:
            logger.error("Failed to get students by subject", subject_id=subject_id, error=str(e))
            return []

    async def get_student_assignments_count(
        self,
        student_id: str,
        tutor_id: str,
        status: Optional[str] = None
    ) -> int:
        """Get total count of assignments for a student"""
        try:
            query = {
                "tutor_id": tutor_id,
                "student_ids": student_id
            }

            if status:
                query["status"] = status

            count = await self.collection.count_documents(query)
            return count
        except Exception as e:
            logger.error("Failed to get student assignments count", error=str(e))
            raise DatabaseException(f"Failed to get assignments count: {str(e)}")

    async def get_student_assignments_paginated(
        self,
        student_id: str,
        tutor_id: str,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 10
    ) -> List[Assignment]:
        """Get paginated assignments for a student"""
        try:
            query = {
                "tutor_id": tutor_id,
                "student_ids": student_id
            }

            if status:
                query["status"] = status

            cursor = self.collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
            assignments_data = await cursor.to_list(length=limit)

            assignments = []
            for assignment_data in assignments_data:
                assignments.append(Assignment(**assignment_data))

            return assignments
        except Exception as e:
            logger.error("Failed to get paginated student assignments", error=str(e))
            raise DatabaseException(f"Failed to get assignments: {str(e)}")
