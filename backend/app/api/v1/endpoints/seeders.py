"""
Database seeder management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog

from app.core.database import get_database
from backend.scripts.seeders import DatabaseSeeder

logger = structlog.get_logger()
router = APIRouter()

@router.post("/seed")
async def seed_database(
    clear_existing: bool = True,
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Seed the database with development data"""
    try:
        seeder = DatabaseSeeder(database)
        results = await seeder.seed_all(clear_existing=clear_existing)
        
        return {
            "message": "Database seeded successfully",
            "results": results
        }
    except Exception as e:
        logger.error("Failed to seed database", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to seed database: {str(e)}")

@router.delete("/clear")
async def clear_database(
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Clear all data from the database"""
    try:
        seeder = DatabaseSeeder(database)
        await seeder.clear_collections()
        
        return {"message": "Database cleared successfully"}
    except Exception as e:
        logger.error("Failed to clear database", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to clear database: {str(e)}")

@router.get("/status")
async def get_database_status(
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get current database status and record counts"""
    try:
        collections = [
            "users", "subjects", "questions", 
            "assignments", "progress", 
            "notifications"
        ]
        
        status = {}
        for collection in collections:
            count = await database[collection].count_documents({})
            status[collection] = count
        
        return {
            "status": "connected",
            "collections": status,
            "total_records": sum(status.values())
        }
    except Exception as e:
        logger.error("Failed to get database status", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get database status: {str(e)}")
