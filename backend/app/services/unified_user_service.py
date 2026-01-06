"""
Unified User Service
Facade to abstract user retrieval across multiple role-specific collections.
"""
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog
import asyncio

from app.models.user import User, UserRole
from app.core.constants import CollectionNames
from app.core.exceptions import NotFoundError

logger = structlog.get_logger()

class UnifiedUserService:
    """
    Service to handle user operations across multiple collections.
    Acts as a facade over Tutors, Students, and Parents collections.
    """

    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.collections = {
            UserRole.TUTOR: database[CollectionNames.TUTORS],
            UserRole.STUDENT: database[CollectionNames.STUDENTS],
            UserRole.PARENT: database[CollectionNames.PARENTS],
            UserRole.ADMIN: database[CollectionNames.USERS]
        }

    async def get_user_by_clerk_id(self, clerk_id: str) -> Optional[User]:
        """
        Find a user by their Clerk ID across all collections.
        Returns the first match found.
        """
        # Try to find user in all collections concurrently for performance
        tasks = []
        roles = []
        
        for role, collection in self.collections.items():
            tasks.append(collection.find_one({"clerk_id": clerk_id}))
            roles.append(role)
            
        results = await asyncio.gather(*tasks)
        
        for i, result in enumerate(results):
            if result:
                # Ensure the document has the correct role set
                if "role" not in result:
                    result["role"] = roles[i]
                
                # Convert _id to string if needed (usually handled by User model)
                if "_id" in result:
                    result["_id"] = str(result["_id"])
                    
                return User(**result)
                
        return None

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Find a user by their email across all collections.
        """
        tasks = []
        roles = []
        
        for role, collection in self.collections.items():
            tasks.append(collection.find_one({"email": email}))
            roles.append(role)
            
        results = await asyncio.gather(*tasks)
        
        for i, result in enumerate(results):
            if result:
                if "role" not in result:
                    result["role"] = roles[i]
                if "_id" in result:
                    result["_id"] = str(result["_id"])
                return User(**result)
                
        return None

    async def get_user_role(self, clerk_id: str) -> Optional[UserRole]:
        """
        Quickly determine a user's role by checking existence in collections.
        Optimized to return only projection.
        """
        tasks = []
        roles = []
        
        for role, collection in self.collections.items():
            # fetch only _id to be lightweight
            tasks.append(collection.find_one({"clerk_id": clerk_id}, projection={"_id": 1}))
            roles.append(role)
            
        results = await asyncio.gather(*tasks)
        
        for i, result in enumerate(results):
            if result:
                return roles[i]
                
        return None
