"""
MongoDB database connection and configuration
"""
import asyncio
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import structlog

from app.core.config import settings

logger = structlog.get_logger()


class Database:
    """MongoDB database manager"""
    
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.database: Optional[AsyncIOMotorDatabase] = None
    
    async def connect_to_database(self):
        """Create database connection"""
        try:
            logger.info("Connecting to MongoDB", url=settings.MONGODB_URL)
            self.client = AsyncIOMotorClient(settings.MONGODB_URL)
            self.database = self.client[settings.DATABASE_NAME]
            
            # Test the connection
            await self.client.admin.command('ping')
            logger.info("Successfully connected to MongoDB")
            
            # Create indexes
            await self._create_indexes()
            
        except Exception as e:
            logger.error("Failed to connect to MongoDB", error=str(e))
            raise
    
    async def close_database_connection(self):
        """Close database connection"""
        if self.client:
            logger.info("Closing MongoDB connection")
            self.client.close()
    
    async def _create_indexes(self):
        """Create database indexes for better performance"""
        try:
            # Users collection indexes
            await self.database.users.create_index("auth0_id", unique=True, sparse=True)
            await self.database.users.create_index("email", unique=True)
            
            # Subjects collection indexes
            await self.database.subjects.create_index("tutor_id")
            await self.database.subjects.create_index([("tutor_id", 1), ("name", 1)], unique=True)
            
            # Questions collection indexes
            await self.database.questions.create_index("subject_id")
            await self.database.questions.create_index("tutor_id")
            await self.database.questions.create_index([("subject_id", 1), ("topic", 1)])
            
            # Assignments collection indexes
            await self.database.assignments.create_index("tutor_id")
            await self.database.assignments.create_index("student_ids")
            await self.database.assignments.create_index("due_date")
            await self.database.assignments.create_index("status")
            
            # Progress collection indexes
            await self.database.progress.create_index([("student_id", 1), ("assignment_id", 1)], unique=True)
            await self.database.progress.create_index("student_id")
            await self.database.progress.create_index("assignment_id")

            # Students collection indexes
            await self.database.students.create_index("userId")
            await self.database.students.create_index("email")

            # Student groups collection indexes
            await self.database.student_groups.create_index("userId")

            # Files collection indexes
            await self.database.files.create_index("userId")
            await self.database.files.create_index("uploadthingUrl")

            # Student performance collection indexes
            await self.database.student_performance.create_index("student_id")
            await self.database.student_performance.create_index("subject")

            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.warning("Failed to create some indexes", error=str(e))


# Global database instance
database = Database()


async def get_database() -> AsyncIOMotorDatabase:
    """Dependency to get database instance"""
    return database.database
