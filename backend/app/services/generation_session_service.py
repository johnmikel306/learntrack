"""
Generation Session Service

Handles CRUD operations for question generation sessions.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import structlog
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.generation_session import (
    GenerationSessionModel, SessionStatus, StoredQuestion, 
    QuestionStatus, SessionSummary
)

logger = structlog.get_logger()


class GenerationSessionService:
    """Service for managing generation sessions"""
    
    COLLECTION = "generation_sessions"
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db[self.COLLECTION]
    
    async def create_session(
        self,
        user_id: str,
        tenant_id: str,
        prompt: str,
        config: Dict[str, Any],
        material_ids: Optional[List[str]] = None
    ) -> GenerationSessionModel:
        """Create a new generation session"""
        session_id = str(uuid.uuid4())
        
        session = GenerationSessionModel(
            session_id=session_id,
            user_id=user_id,
            tenant_id=tenant_id,
            original_prompt=prompt,
            config=config,
            material_ids=material_ids or [],
            total_questions=config.get("question_count", 5),
            status=SessionStatus.PENDING
        )
        
        doc = session.model_dump(by_alias=True, exclude={"id"})
        doc["_id"] = session_id
        
        await self.collection.insert_one(doc)
        logger.info("Created generation session", session_id=session_id)
        
        return session
    
    async def get_session(
        self, 
        session_id: str, 
        user_id: str
    ) -> Optional[GenerationSessionModel]:
        """Get a session by ID"""
        doc = await self.collection.find_one({
            "_id": session_id,
            "user_id": user_id
        })
        
        if not doc:
            return None
        
        return GenerationSessionModel(**doc)
    
    async def update_session(
        self,
        session_id: str,
        user_id: str,
        **updates
    ) -> Optional[GenerationSessionModel]:
        """Update a session"""
        updates["updated_at"] = datetime.now(timezone.utc)
        
        result = await self.collection.find_one_and_update(
            {"_id": session_id, "user_id": user_id},
            {"$set": updates},
            return_document=True
        )
        
        if not result:
            return None
        
        return GenerationSessionModel(**result)
    
    async def add_question(
        self,
        session_id: str,
        user_id: str,
        question: StoredQuestion
    ) -> bool:
        """Add a question to a session"""
        result = await self.collection.update_one(
            {"_id": session_id, "user_id": user_id},
            {
                "$push": {"questions": question.model_dump()},
                "$inc": {"current_question_index": 1},
                "$set": {"updated_at": datetime.now(timezone.utc)}
            }
        )
        return result.modified_count > 0
    
    async def update_question_status(
        self,
        session_id: str,
        user_id: str,
        question_id: str,
        status: QuestionStatus
    ) -> bool:
        """Update a question's status"""
        result = await self.collection.update_one(
            {
                "_id": session_id,
                "user_id": user_id,
                "questions.question_id": question_id
            },
            {
                "$set": {
                    "questions.$.status": status.value,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        return result.modified_count > 0
    
    async def list_sessions(
        self,
        user_id: str,
        tenant_id: str,
        status: Optional[SessionStatus] = None,
        page: int = 1,
        per_page: int = 20
    ) -> tuple[List[SessionSummary], int]:
        """List sessions for a user"""
        query = {"user_id": user_id, "tenant_id": tenant_id}
        if status:
            query["status"] = status.value
        
        total = await self.collection.count_documents(query)
        
        cursor = self.collection.find(query).sort("created_at", -1).skip((page - 1) * per_page).limit(per_page)
        
        sessions = []
        async for doc in cursor:
            questions = doc.get("questions", [])
            approved = sum(1 for q in questions if q.get("status") == QuestionStatus.APPROVED.value)
            
            sessions.append(SessionSummary(
                session_id=doc["session_id"],
                status=SessionStatus(doc["status"]),
                original_prompt=doc["original_prompt"],
                questions_count=len(questions),
                approved_count=approved,
                created_at=doc["created_at"],
                updated_at=doc["updated_at"]
            ))

        return sessions, total

    async def get_stats(
        self,
        user_id: str,
        tenant_id: str
    ) -> dict:
        """Get generation statistics for a user"""
        from datetime import timedelta

        # Get current month start
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        query = {"user_id": user_id, "tenant_id": tenant_id}

        # Total sessions
        total_sessions = await self.collection.count_documents(query)

        # This month's sessions
        month_query = {**query, "created_at": {"$gte": month_start}}
        month_sessions = await self.collection.count_documents(month_query)

        # Aggregate questions data
        pipeline = [
            {"$match": query},
            {"$unwind": {"path": "$questions", "preserveNullAndEmptyArrays": False}},
            {"$group": {
                "_id": None,
                "total_questions": {"$sum": 1},
                "approved": {"$sum": {"$cond": [{"$eq": ["$questions.status", "approved"]}, 1, 0]}},
                "rejected": {"$sum": {"$cond": [{"$eq": ["$questions.status", "rejected"]}, 1, 0]}},
            }}
        ]

        result = await self.collection.aggregate(pipeline).to_list(1)

        if result:
            total_questions = result[0].get("total_questions", 0)
            approved = result[0].get("approved", 0)
            rejected = result[0].get("rejected", 0)
        else:
            total_questions = 0
            approved = 0
            rejected = 0

        # This month's questions
        month_pipeline = [
            {"$match": month_query},
            {"$unwind": {"path": "$questions", "preserveNullAndEmptyArrays": False}},
            {"$count": "count"}
        ]
        month_result = await self.collection.aggregate(month_pipeline).to_list(1)
        month_questions = month_result[0]["count"] if month_result else 0

        # Success rate (completed sessions / total sessions)
        completed = await self.collection.count_documents({**query, "status": SessionStatus.COMPLETED.value})
        success_rate = round((completed / total_sessions * 100), 1) if total_sessions > 0 else 0

        # Average quality (approved / (approved + rejected))
        reviewed = approved + rejected
        avg_quality = round((approved / reviewed * 5), 1) if reviewed > 0 else 0  # Scale to 5

        return {
            "total_generated": total_questions,
            "this_month": month_questions,
            "success_rate": success_rate,
            "avg_quality": avg_quality,
            "total_sessions": total_sessions,
            "month_sessions": month_sessions,
            "approved_questions": approved,
            "rejected_questions": rejected
        }
