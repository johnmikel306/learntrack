"""
Tenant isolation middleware for multi-tenant SaaS platform
"""
from typing import Optional, Dict, Any, Callable
from fastapi import Request, Response, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
import structlog
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorCollection

from app.core.enhanced_auth import ClerkUserContext as UserContext, get_current_user
from app.models.user import UserRole

logger = structlog.get_logger()


class TenantContext:
    """Context object for tenant-aware operations"""

    def __init__(self, tutor_id: str, user_context: UserContext):
        self.tutor_id = tutor_id
        self.user_context = user_context
        self.role = user_context.role
        self.student_ids = user_context.student_ids


class TenantAwareCollection:
    """Wrapper for MongoDB collection that automatically applies tenant filtering"""
    
    def __init__(self, collection: AsyncIOMotorCollection, tenant_context: TenantContext):
        self._collection = collection
        self._tenant_context = tenant_context
    
    def _add_tenant_filter(self, filter_dict: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Add tutor_id filter to query"""
        if filter_dict is None:
            filter_dict = {}

        # Always add tutor_id filter
        filter_dict["tutor_id"] = self._tenant_context.tutor_id
        
        # For parents, also filter by student_ids if querying student-related data
        if (self._tenant_context.role == UserRole.PARENT and 
            self._tenant_context.student_ids and
            self._collection.name in ["students", "assignments", "progress"]):
            
            # If querying students directly, limit to parent's children
            if self._collection.name == "students":
                filter_dict["_id"] = {"$in": self._tenant_context.student_ids}
            # For assignments/progress, filter by student_id
            elif "student_id" in filter_dict or self._collection.name in ["assignments", "progress"]:
                if "student_id" not in filter_dict:
                    filter_dict["student_id"] = {"$in": self._tenant_context.student_ids}
                else:
                    # Ensure student_id is in parent's allowed list
                    existing_student_filter = filter_dict["student_id"]
                    if isinstance(existing_student_filter, str):
                        if existing_student_filter not in self._tenant_context.student_ids:
                            raise HTTPException(
                                status_code=status.HTTP_403_FORBIDDEN,
                                detail="Access denied: Student not assigned to parent"
                            )
                    elif isinstance(existing_student_filter, dict) and "$in" in existing_student_filter:
                        # Intersect with allowed student IDs
                        allowed_students = set(self._tenant_context.student_ids)
                        requested_students = set(existing_student_filter["$in"])
                        filter_dict["student_id"]["$in"] = list(allowed_students.intersection(requested_students))
        
        return filter_dict
    
    def _add_tenant_data(self, document: Dict[str, Any]) -> Dict[str, Any]:
        """Add tutor_id to document for insert operations"""
        if "tutor_id" not in document:
            document["tutor_id"] = self._tenant_context.tutor_id
        elif document["tutor_id"] != self._tenant_context.tutor_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot create/update data for different tutor"
            )
        return document
    
    async def find_one(self, filter_dict: Optional[Dict[str, Any]] = None, *args, **kwargs):
        """Find one document with tenant filtering"""
        filtered_query = self._add_tenant_filter(filter_dict)
        return await self._collection.find_one(filtered_query, *args, **kwargs)
    
    def find(self, filter_dict: Optional[Dict[str, Any]] = None, *args, **kwargs):
        """Find documents with tenant filtering"""
        filtered_query = self._add_tenant_filter(filter_dict)
        return self._collection.find(filtered_query, *args, **kwargs)
    
    async def insert_one(self, document: Dict[str, Any], *args, **kwargs):
        """Insert document with tenant_id"""
        tenant_document = self._add_tenant_data(document.copy())
        return await self._collection.insert_one(tenant_document, *args, **kwargs)
    
    async def insert_many(self, documents: list, *args, **kwargs):
        """Insert multiple documents with tenant_id"""
        tenant_documents = [self._add_tenant_data(doc.copy()) for doc in documents]
        return await self._collection.insert_many(tenant_documents, *args, **kwargs)
    
    async def update_one(self, filter_dict: Dict[str, Any], update: Dict[str, Any], *args, **kwargs):
        """Update one document with tenant filtering"""
        filtered_query = self._add_tenant_filter(filter_dict)
        
        # Ensure update doesn't change tutor_id
        if "$set" in update and "tutor_id" in update["$set"]:
            if update["$set"]["tutor_id"] != self._tenant_context.tutor_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot change tutor_id"
                )
        
        return await self._collection.update_one(filtered_query, update, *args, **kwargs)
    
    async def update_many(self, filter_dict: Dict[str, Any], update: Dict[str, Any], *args, **kwargs):
        """Update multiple documents with tenant filtering"""
        filtered_query = self._add_tenant_filter(filter_dict)
        
        # Ensure update doesn't change tutor_id
        if "$set" in update and "tutor_id" in update["$set"]:
            if update["$set"]["tutor_id"] != self._tenant_context.tutor_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot change tutor_id"
                )
        
        return await self._collection.update_many(filtered_query, update, *args, **kwargs)
    
    async def delete_one(self, filter_dict: Dict[str, Any], *args, **kwargs):
        """Delete one document with tenant filtering"""
        filtered_query = self._add_tenant_filter(filter_dict)
        return await self._collection.delete_one(filtered_query, *args, **kwargs)
    
    async def delete_many(self, filter_dict: Dict[str, Any], *args, **kwargs):
        """Delete multiple documents with tenant filtering"""
        filtered_query = self._add_tenant_filter(filter_dict)
        return await self._collection.delete_many(filtered_query, *args, **kwargs)
    
    async def count_documents(self, filter_dict: Optional[Dict[str, Any]] = None, *args, **kwargs):
        """Count documents with tenant filtering"""
        filtered_query = self._add_tenant_filter(filter_dict)
        return await self._collection.count_documents(filtered_query, *args, **kwargs)
    
    async def aggregate(self, pipeline: list, *args, **kwargs):
        """Aggregate with tenant filtering"""
        # Add tenant filter as first stage in pipeline
        tenant_match = {"$match": {"tutor_id": self._tenant_context.tutor_id}}
        
        # For parents, add additional filtering for student-related collections
        if (self._tenant_context.role == UserRole.PARENT and 
            self._tenant_context.student_ids and
            self._collection.name in ["students", "assignments", "progress"]):
            
            if self._collection.name == "students":
                tenant_match["$match"]["_id"] = {"$in": self._tenant_context.student_ids}
            elif self._collection.name in ["assignments", "progress"]:
                tenant_match["$match"]["student_id"] = {"$in": self._tenant_context.student_ids}
        
        filtered_pipeline = [tenant_match] + pipeline
        return self._collection.aggregate(filtered_pipeline, *args, **kwargs)


class TenantAwareDatabase:
    """Wrapper for MongoDB database that returns tenant-aware collections"""
    
    def __init__(self, database: AsyncIOMotorDatabase, tenant_context: TenantContext):
        self._database = database
        self._tenant_context = tenant_context
    
    def __getattr__(self, name: str):
        """Get collection with tenant awareness"""
        if name.startswith('_'):
            return getattr(self._database, name)
        
        collection = getattr(self._database, name)
        return TenantAwareCollection(collection, self._tenant_context)
    
    def get_collection(self, name: str):
        """Get collection with tenant awareness"""
        collection = self._database.get_collection(name)
        return TenantAwareCollection(collection, self._tenant_context)


def get_tenant_aware_database(database: AsyncIOMotorDatabase, user_context: UserContext) -> TenantAwareDatabase:
    """Get tenant-aware database wrapper"""
    if not user_context.tutor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not assigned to any tutor"
        )

    tenant_context = TenantContext(user_context.tutor_id, user_context)
    return TenantAwareDatabase(database, tenant_context)


# FastAPI dependency for tenant-aware database
async def get_tenant_database(
    user_context: UserContext,
    database: AsyncIOMotorDatabase
) -> TenantAwareDatabase:
    """FastAPI dependency to get tenant-aware database"""
    return get_tenant_aware_database(database, user_context)
