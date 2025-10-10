"""
Topics endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog
from datetime import datetime
from bson import ObjectId

from app.core.database import get_database
from app.core.enhanced_auth import require_tutor, ClerkUserContext
from pydantic import BaseModel, Field

logger = structlog.get_logger()
router = APIRouter()


class TopicBase(BaseModel):
    """Base topic model"""
    name: str
    subject_id: str
    difficulty: str = "intermediate"


class TopicCreate(TopicBase):
    """Topic creation model"""
    pass


class Topic(TopicBase):
    """Topic response model"""
    id: str = Field(alias="_id")
    subject_name: str
    question_count: int = 0
    assignment_count: int = 0
    completion_rate: float = 0.0
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


@router.get("/", response_model=List[Topic])
async def get_topics(
    subject_id: Optional[str] = Query(None, description="Filter by subject ID"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all topics, optionally filtered by subject"""
    try:
        query = {}
        if subject_id:
            query["subject_id"] = subject_id
        
        topics = await database.topics.find(query).to_list(length=100)
        
        # Convert ObjectId to string
        for topic in topics:
            topic["_id"] = str(topic["_id"])
        
        return topics
    except Exception as e:
        logger.error("Failed to get topics", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get topics: {str(e)}")


@router.post("/", response_model=Topic, status_code=status.HTTP_201_CREATED)
async def create_topic(
    topic_data: TopicCreate,
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new topic"""
    try:
        # Get subject to get subject name
        subject = await database.subjects.find_one({"_id": ObjectId(topic_data.subject_id)})
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        
        topic_dict = topic_data.dict()
        topic_dict["subject_name"] = subject["name"]
        topic_dict["question_count"] = 0
        topic_dict["assignment_count"] = 0
        topic_dict["completion_rate"] = 0.0
        topic_dict["created_at"] = datetime.utcnow()
        topic_dict["updated_at"] = datetime.utcnow()
        
        result = await database.topics.insert_one(topic_dict)
        topic_dict["_id"] = str(result.inserted_id)
        
        logger.info("Topic created", topic_id=str(result.inserted_id))
        return topic_dict
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create topic", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to create topic: {str(e)}")


@router.get("/{topic_id}", response_model=Topic)
async def get_topic(
    topic_id: str,
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a specific topic"""
    try:
        topic = await database.topics.find_one({"_id": ObjectId(topic_id)})
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        
        topic["_id"] = str(topic["_id"])
        return topic
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get topic", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get topic: {str(e)}")


@router.put("/{topic_id}", response_model=Topic)
async def update_topic(
    topic_id: str,
    topic_data: TopicCreate,
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update a topic"""
    try:
        update_dict = topic_data.dict()
        update_dict["updated_at"] = datetime.utcnow()
        
        result = await database.topics.update_one(
            {"_id": ObjectId(topic_id)},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Topic not found")
        
        topic = await database.topics.find_one({"_id": ObjectId(topic_id)})
        topic["_id"] = str(topic["_id"])
        
        logger.info("Topic updated", topic_id=topic_id)
        return topic
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update topic", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to update topic: {str(e)}")


@router.delete("/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_topic(
    topic_id: str,
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a topic"""
    try:
        result = await database.topics.delete_one({"_id": ObjectId(topic_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Topic not found")
        
        logger.info("Topic deleted", topic_id=topic_id)
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete topic", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to delete topic: {str(e)}")

