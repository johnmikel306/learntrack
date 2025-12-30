"""
Migration 003: Add activity and template indexes
Adds indexes for activities and assignment templates collections.
"""
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.migrations import Migration


async def up(db: AsyncIOMotorDatabase):
    """Create indexes for activities and templates"""
    
    # Activities collection indexes (with tenant isolation)
    await db.activities.create_index("tutor_id")
    await db.activities.create_index("user_id")
    await db.activities.create_index("student_id")
    await db.activities.create_index([("tutor_id", 1), ("created_at", -1)])
    await db.activities.create_index([("student_id", 1), ("created_at", -1)])
    await db.activities.create_index([("tutor_id", 1), ("activity_type", 1)])
    
    # Student performance collection indexes
    await db.student_performance.create_index("student_id")
    await db.student_performance.create_index("subject")
    await db.student_performance.create_index([("student_id", 1), ("subject", 1)])
    
    # Assignment templates collection indexes
    await db.assignment_templates.create_index("tutor_id")
    await db.assignment_templates.create_index("tenant_id")
    await db.assignment_templates.create_index("subject_id")
    await db.assignment_templates.create_index("status")
    await db.assignment_templates.create_index("tags")
    await db.assignment_templates.create_index([("tutor_id", 1), ("status", 1)])
    await db.assignment_templates.create_index([("tutor_id", 1), ("usage_count", -1)])
    await db.assignment_templates.create_index([("tutor_id", 1), ("created_at", -1)])
    
    # Generation sessions collection indexes
    await db.generation_sessions.create_index("tutor_id")
    await db.generation_sessions.create_index("user_id")
    await db.generation_sessions.create_index("status")
    await db.generation_sessions.create_index([("tutor_id", 1), ("created_at", -1)])


async def down(db: AsyncIOMotorDatabase):
    """Rollback - no action needed"""
    pass


migration = Migration(
    version="003",
    name="add_activity_indexes",
    description="Add indexes for activities, student performance, assignment templates, and generation sessions",
    up=up,
    down=down
)

