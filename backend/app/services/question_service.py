"""
Question service for database operations
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog

from app.models.question import Question, QuestionCreate, QuestionUpdate, QuestionForStudent
from app.core.exceptions import NotFoundError, DatabaseException, AuthorizationError
from app.core.utils import to_object_id

logger = structlog.get_logger()


class QuestionService:
    """Question service for database operations"""
    
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.collection = database.questions
    
    async def create_question(self, question_data: QuestionCreate, tutor_id: str) -> Question:
        """Create a new question"""
        try:
            question_dict = question_data.dict()
            question_dict["tutor_id"] = tutor_id
            question_dict["created_at"] = datetime.utcnow()
            question_dict["updated_at"] = datetime.utcnow()
            question_dict["status"] = "active"
            question_dict["times_used"] = 0
            
            result = await self.collection.insert_one(question_dict)
            question_dict["_id"] = result.inserted_id
            
            logger.info("Question created", question_id=str(result.inserted_id), tutor_id=tutor_id)
            return Question(**question_dict)
            
        except Exception as e:
            logger.error("Failed to create question", error=str(e))
            raise DatabaseException(f"Failed to create question: {str(e)}")
    
    async def get_question_by_id(self, question_id: str) -> Question:
        """Get question by ID"""
        try:
            oid = to_object_id(question_id)
            question = await self.collection.find_one({"_id": oid, "status": {"$ne": "deleted"}})
            if not question:
                raise NotFoundError("Question", question_id)
            return Question(**question)
        except NotFoundError:
            raise
        except Exception as e:
            logger.error("Failed to get question", question_id=question_id, error=str(e))
            raise DatabaseException(f"Failed to get question: {str(e)}")
    
    async def get_question_for_student(self, question_id: str) -> QuestionForStudent:
        """Get question for student (without correct answers)"""
        question = await self.get_question_by_id(question_id)
        
        # Remove correct answer information
        student_question = QuestionForStudent(
            id=str(question.id),
            question_text=question.question_text,
            question_type=question.question_type,
            topic=question.topic,
            difficulty=question.difficulty,
            points=question.points,
            options=[{"text": opt.text} for opt in question.options] if question.options else []
        )
        
        return student_question
    
    async def get_questions_by_subject(
        self, 
        subject_id: str, 
        topic: Optional[str] = None,
        difficulty: Optional[str] = None,
        limit: int = 50
    ) -> List[Question]:
        """Get questions by subject with optional filters"""
        try:
            query = {"subject_id": subject_id, "status": "active"}
            
            if topic:
                query["topic"] = topic
            if difficulty:
                query["difficulty"] = difficulty
            
            cursor = self.collection.find(query).limit(limit).sort("created_at", -1)
            
            questions = []
            async for question in cursor:
                questions.append(Question(**question))
            
            return questions
            
        except Exception as e:
            logger.error("Failed to get questions by subject", subject_id=subject_id, error=str(e))
            raise DatabaseException(f"Failed to get questions: {str(e)}")
    
    async def update_question(self, question_id: str, question_update: QuestionUpdate, tutor_id: str) -> Question:
        """Update question"""
        try:
            # Verify ownership
            question = await self.get_question_by_id(question_id)
            if question.tutor_id != tutor_id:
                raise AuthorizationError("Not authorized to update this question")
            
            update_data = question_update.dict(exclude_unset=True)
            if not update_data:
                return question
            
            update_data["updated_at"] = datetime.utcnow()
            
            oid = to_object_id(question_id)
            result = await self.collection.update_one(
                {"_id": oid},
                {"$set": update_data}
            )
            
            if result.matched_count == 0:
                raise NotFoundError("Question", question_id)
            
            logger.info("Question updated", question_id=question_id)
            return await self.get_question_by_id(question_id)
            
        except (NotFoundError, AuthorizationError):
            raise
        except Exception as e:
            logger.error("Failed to update question", question_id=question_id, error=str(e))
            raise DatabaseException(f"Failed to update question: {str(e)}")
    
    async def delete_question(self, question_id: str, tutor_id: str) -> bool:
        """Delete question (soft delete)"""
        try:
            # Verify ownership
            question = await self.get_question_by_id(question_id)
            if question.tutor_id != tutor_id:
                raise AuthorizationError("Not authorized to delete this question")
            
            # Check if question is used in any assignments
            assignment_count = await self.db.assignments.count_documents({
                "questions.question_id": question_id
            })
            
            if assignment_count > 0:
                from app.core.exceptions import ValidationError
                raise ValidationError("Cannot delete question that is used in assignments")
            
            oid = to_object_id(question_id)
            result = await self.collection.update_one(
                {"_id": oid},
                {"$set": {"status": "deleted", "updated_at": datetime.utcnow()}}
            )
            
            if result.matched_count == 0:
                raise NotFoundError("Question", question_id)
            
            logger.info("Question deleted", question_id=question_id)
            return True
            
        except (NotFoundError, AuthorizationError):
            raise
        except Exception as e:
            logger.error("Failed to delete question", question_id=question_id, error=str(e))
            raise DatabaseException(f"Failed to delete question: {str(e)}")
    
    async def increment_usage_count(self, question_id: str) -> bool:
        """Increment question usage count"""
        try:
            oid = to_object_id(question_id)
            result = await self.collection.update_one(
                {"_id": oid},
                {"$inc": {"times_used": 1}}
            )
            return result.matched_count > 0
        except Exception as e:
            logger.error("Failed to increment usage count", question_id=question_id, error=str(e))
            return False
    
    async def update_average_score(self, question_id: str, new_score: float) -> bool:
        """Update question average score"""
        try:
            # Get current question to calculate new average
            question = await self.get_question_by_id(question_id)
            
            if question.average_score is None:
                new_average = new_score
            else:
                # Simple average calculation - in production you might want more sophisticated tracking
                new_average = (question.average_score + new_score) / 2
            
            oid = to_object_id(question_id)
            result = await self.collection.update_one(
                {"_id": oid},
                {"$set": {"average_score": new_average}}
            )
            
            return result.matched_count > 0
            
        except Exception as e:
            logger.error("Failed to update average score", question_id=question_id, error=str(e))
            return False
