"""
Activity service for tracking user activities
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import structlog

from app.models.activity import (
    Activity, ActivityCreate, ActivityInDB,
    ActivityType, StudentActivitySummary
)

logger = structlog.get_logger()


class ActivityService:
    """Service for managing activities"""
    
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.collection = database.activities
    
    async def create_activity(
        self,
        activity_data: ActivityCreate
    ) -> Activity:
        """Create a new activity record"""
        try:
            activity_dict = activity_data.model_dump()
            activity_dict["created_at"] = datetime.utcnow()
            
            result = await self.collection.insert_one(activity_dict)
            activity_dict["_id"] = str(result.inserted_id)
            
            return Activity(**activity_dict)
        except Exception as e:
            logger.error("Failed to create activity", error=str(e))
            raise
    
    async def get_user_activities(
        self,
        user_id: str,
        limit: int = 50,
        activity_types: Optional[List[ActivityType]] = None
    ) -> List[Activity]:
        """Get activities for a user"""
        try:
            query = {"user_id": user_id}
            if activity_types:
                query["activity_type"] = {"$in": [at.value for at in activity_types]}
            
            cursor = self.collection.find(query).sort("created_at", -1).limit(limit)
            activities_data = await cursor.to_list(length=limit)
            
            activities = []
            for activity_data in activities_data:
                activity_data["_id"] = str(activity_data["_id"])
                activities.append(Activity(**activity_data))
            
            return activities
        except Exception as e:
            logger.error("Failed to get user activities", error=str(e))
            raise
    
    async def get_student_activity_summary(
        self,
        student_id: str,
        limit: int = 10
    ) -> List[StudentActivitySummary]:
        """Get formatted activity summary for student details page"""
        try:
            activities = await self.get_user_activities(student_id, limit=limit)
            
            summaries = []
            for activity in activities:
                summary = self._format_activity_summary(activity)
                if summary:
                    summaries.append(summary)
            
            return summaries
        except Exception as e:
            logger.error("Failed to get student activity summary", error=str(e))
            raise
    
    def _format_activity_summary(self, activity: Activity) -> Optional[StudentActivitySummary]:
        """Format activity into a summary for display"""
        activity_map = {
            ActivityType.ASSIGNMENT_COMPLETED: {
                "title": "Assignment Completed",
                "icon": "CheckCircle"
            },
            ActivityType.ASSIGNMENT_SUBMITTED: {
                "title": "Assignment Submitted",
                "icon": "Upload"
            },
            ActivityType.ASSIGNMENT_STARTED: {
                "title": "Assignment Started",
                "icon": "Play"
            },
            ActivityType.MATERIAL_VIEWED: {
                "title": "Material Viewed",
                "icon": "Eye"
            },
            ActivityType.MATERIAL_DOWNLOADED: {
                "title": "Material Downloaded",
                "icon": "Download"
            },
            ActivityType.MESSAGE_SENT: {
                "title": "Message Sent",
                "icon": "MessageSquare"
            },
        }
        
        config = activity_map.get(activity.activity_type)
        if not config:
            return None
        
        return StudentActivitySummary(
            activity_type=activity.activity_type.value,
            title=config["title"],
            description=activity.description or f"{config['title']} activity",
            timestamp=activity.created_at,
            related_entity_id=activity.related_entity_id,
            icon=config["icon"]
        )
    
    async def get_recent_activities(
        self,
        tutor_id: str,
        days: int = 7,
        limit: int = 100
    ) -> List[Activity]:
        """Get recent activities for a tutor's students"""
        try:
            since_date = datetime.utcnow() - timedelta(days=days)
            
            cursor = self.collection.find({
                "tutor_id": tutor_id,
                "created_at": {"$gte": since_date}
            }).sort("created_at", -1).limit(limit)
            
            activities_data = await cursor.to_list(length=limit)
            
            activities = []
            for activity_data in activities_data:
                activity_data["_id"] = str(activity_data["_id"])
                activities.append(Activity(**activity_data))
            
            return activities
        except Exception as e:
            logger.error("Failed to get recent activities", error=str(e))
            raise

