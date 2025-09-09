"""
Database connection and configuration for LearnTrack
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    database = None

# Database instance
db = Database()

async def connect_to_mongo():
    """Create database connection"""
    try:
        # Get MongoDB connection string from environment
        mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        database_name = os.getenv("DATABASE_NAME", "learntrack")
        
        # Create client
        db.client = AsyncIOMotorClient(mongodb_url)
        
        # Test connection
        await db.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
        
        # Get database
        db.database = db.client[database_name]
        
        # Create indexes
        await create_indexes()
        
    except ConnectionFailure as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise e

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        logger.info("Disconnected from MongoDB")

async def create_indexes():
    """Create database indexes for performance optimization"""
    try:
        # Users collection indexes
        await db.database.users.create_index("clerkId", unique=True)
        await db.database.users.create_index("email", unique=True)
        await db.database.users.create_index("role")
        
        # Questions collection indexes
        await db.database.questions.create_index("createdBy")
        await db.database.questions.create_index([("subject", 1), ("topic", 1)])
        await db.database.questions.create_index("tags")
        
        # Assignments collection indexes
        await db.database.assignments.create_index("createdBy")
        await db.database.assignments.create_index("assignedTo")
        await db.database.assignments.create_index("scheduledFor")
        await db.database.assignments.create_index("dueDate")
        
        # Submissions collection indexes
        await db.database.submissions.create_index([("assignmentId", 1), ("studentId", 1)])
        await db.database.submissions.create_index([("studentId", 1), ("submittedAt", -1)])
        
        # Progress collection indexes
        await db.database.progress.create_index([("studentId", 1), ("date", -1)])
        await db.database.progress.create_index([("tutorId", 1), ("date", -1)])
        await db.database.progress.create_index([("studentId", 1), ("subject", 1), ("date", -1)])
        
        # Notifications collection indexes
        await db.database.notifications.create_index([("recipientId", 1), ("createdAt", -1)])
        await db.database.notifications.create_index([("status", 1), ("createdAt", 1)])
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Failed to create indexes: {e}")

def get_database():
    """Get database instance"""
    return db.database
