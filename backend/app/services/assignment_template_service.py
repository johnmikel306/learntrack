"""
Assignment template service for managing reusable assignment templates
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import structlog

from app.models.assignment_template import (
    AssignmentTemplate,
    AssignmentTemplateCreate,
    AssignmentTemplateUpdate,
    AssignmentTemplateInDB,
    AssignmentTemplateListResponse,
    AssignmentTemplateStats,
    TemplateStatus
)
from app.core.exceptions import NotFoundError, ValidationError

logger = structlog.get_logger()


class AssignmentTemplateService:
    """Service for managing assignment templates"""
    
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.collection = database.assignment_templates
    
    async def create_template(
        self,
        template_data: AssignmentTemplateCreate,
        tutor_id: str
    ) -> AssignmentTemplate:
        """Create a new assignment template"""
        try:
            # Create template document
            template_dict = template_data.model_dump()
            template_dict.update({
                "tutor_id": tutor_id,
                "tenant_id": tutor_id,
                "status": TemplateStatus.ACTIVE,
                "usage_count": 0,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "last_used_at": None
            })
            
            result = await self.collection.insert_one(template_dict)
            template_dict["_id"] = result.inserted_id
            
            return self._to_response_model(template_dict)
        
        except Exception as e:
            logger.error("Failed to create template", error=str(e))
            raise
    
    async def get_template(
        self,
        template_id: str,
        tutor_id: str
    ) -> Optional[AssignmentTemplate]:
        """Get a template by ID"""
        try:
            template = await self.collection.find_one({
                "_id": ObjectId(template_id),
                "tutor_id": tutor_id
            })
            
            if not template:
                return None
            
            return self._to_response_model(template)
        
        except Exception as e:
            logger.error("Failed to get template", error=str(e))
            raise
    
    async def list_templates(
        self,
        tutor_id: str,
        status_filter: Optional[TemplateStatus] = None,
        subject_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> AssignmentTemplateListResponse:
        """List templates for a tutor"""
        try:
            # Build query
            query: Dict[str, Any] = {"tutor_id": tutor_id}
            
            if status_filter:
                query["status"] = status_filter.value
            
            if subject_id:
                query["subject_id"] = subject_id
            
            # Get templates
            cursor = self.collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
            templates = await cursor.to_list(length=limit)
            
            # Get counts
            total = await self.collection.count_documents({"tutor_id": tutor_id})
            active = await self.collection.count_documents({"tutor_id": tutor_id, "status": TemplateStatus.ACTIVE.value})
            archived = await self.collection.count_documents({"tutor_id": tutor_id, "status": TemplateStatus.ARCHIVED.value})
            draft = await self.collection.count_documents({"tutor_id": tutor_id, "status": TemplateStatus.DRAFT.value})
            
            return AssignmentTemplateListResponse(
                templates=[self._to_response_model(t) for t in templates],
                total=total,
                active=active,
                archived=archived,
                draft=draft
            )
        
        except Exception as e:
            logger.error("Failed to list templates", error=str(e))
            raise
    
    async def update_template(
        self,
        template_id: str,
        template_data: AssignmentTemplateUpdate,
        tutor_id: str
    ) -> AssignmentTemplate:
        """Update a template"""
        try:
            # Check if template exists
            existing = await self.collection.find_one({
                "_id": ObjectId(template_id),
                "tutor_id": tutor_id
            })
            
            if not existing:
                raise NotFoundError("Template not found")
            
            # Update template
            update_dict = template_data.model_dump(exclude_unset=True)
            update_dict["updated_at"] = datetime.now(timezone.utc)
            
            await self.collection.update_one(
                {"_id": ObjectId(template_id)},
                {"$set": update_dict}
            )
            
            # Get updated template
            updated = await self.collection.find_one({"_id": ObjectId(template_id)})
            return self._to_response_model(updated)

        except NotFoundError:
            raise
        except Exception as e:
            logger.error("Failed to update template", error=str(e))
            raise

    async def delete_template(
        self,
        template_id: str,
        tutor_id: str
    ) -> None:
        """Delete a template"""
        try:
            result = await self.collection.delete_one({
                "_id": ObjectId(template_id),
                "tutor_id": tutor_id
            })

            if result.deleted_count == 0:
                raise NotFoundError("Template not found")

        except NotFoundError:
            raise
        except Exception as e:
            logger.error("Failed to delete template", error=str(e))
            raise

    async def use_template(
        self,
        template_id: str,
        tutor_id: str
    ) -> AssignmentTemplate:
        """Mark a template as used (increment usage count)"""
        try:
            result = await self.collection.find_one_and_update(
                {
                    "_id": ObjectId(template_id),
                    "tutor_id": tutor_id
                },
                {
                    "$inc": {"usage_count": 1},
                    "$set": {
                        "last_used_at": datetime.now(timezone.utc),
                        "updated_at": datetime.now(timezone.utc)
                    }
                },
                return_document=True
            )

            if not result:
                raise NotFoundError("Template not found")

            return self._to_response_model(result)

        except NotFoundError:
            raise
        except Exception as e:
            logger.error("Failed to use template", error=str(e))
            raise

    async def get_stats(self, tutor_id: str) -> AssignmentTemplateStats:
        """Get statistics about templates"""
        try:
            total = await self.collection.count_documents({"tutor_id": tutor_id})
            active = await self.collection.count_documents({"tutor_id": tutor_id, "status": TemplateStatus.ACTIVE.value})
            archived = await self.collection.count_documents({"tutor_id": tutor_id, "status": TemplateStatus.ARCHIVED.value})
            draft = await self.collection.count_documents({"tutor_id": tutor_id, "status": TemplateStatus.DRAFT.value})

            # Get total usage
            pipeline = [
                {"$match": {"tutor_id": tutor_id}},
                {"$group": {"_id": None, "total_usage": {"$sum": "$usage_count"}}}
            ]
            usage_result = await self.collection.aggregate(pipeline).to_list(1)
            total_usage = usage_result[0]["total_usage"] if usage_result else 0

            # Get most used template
            most_used = await self.collection.find_one(
                {"tutor_id": tutor_id},
                sort=[("usage_count", -1)]
            )

            return AssignmentTemplateStats(
                total_templates=total,
                active=active,
                archived=archived,
                draft=draft,
                total_usage=total_usage,
                most_used_template=self._to_response_model(most_used) if most_used else None
            )

        except Exception as e:
            logger.error("Failed to get template stats", error=str(e))
            raise

    def _to_response_model(self, template_dict: Dict[str, Any]) -> AssignmentTemplate:
        """Convert database document to response model"""
        template_dict["id"] = str(template_dict.pop("_id"))
        return AssignmentTemplate(**template_dict)

