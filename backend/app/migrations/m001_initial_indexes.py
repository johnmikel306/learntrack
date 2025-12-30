"""
Migration 001: Initial database indexes
Creates all core indexes for the LearnTrack application.
"""
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.migrations import Migration


async def up(db: AsyncIOMotorDatabase):
    """Create initial indexes"""
    
    # Tutors collection indexes
    await db.tutors.create_index("clerk_id", unique=True)
    await db.tutors.create_index("email", unique=True)
    await db.tutors.create_index("slug", unique=True)
    await db.tutors.create_index("tenant_id")
    
    # Students collection indexes
    await db.students.create_index("clerk_id", unique=True)
    await db.students.create_index("email", unique=True)
    await db.students.create_index("slug", unique=True)
    await db.students.create_index("tutor_id")
    await db.students.create_index("tenant_id")
    await db.students.create_index([("tutor_id", 1), ("is_active", 1)])
    
    # Parents collection indexes
    await db.parents.create_index("clerk_id", unique=True)
    await db.parents.create_index("email", unique=True)
    await db.parents.create_index("slug", unique=True)
    await db.parents.create_index("tutor_id")
    await db.parents.create_index("tenant_id")
    await db.parents.create_index("student_ids")
    
    # Subjects collection indexes
    await db.subjects.create_index("tutor_id")
    await db.subjects.create_index([("tutor_id", 1), ("name", 1)], unique=True)
    
    # Questions collection indexes
    await db.questions.create_index("subject_id")
    await db.questions.create_index("tutor_id")
    await db.questions.create_index([("subject_id", 1), ("topic", 1)])
    
    # Assignments collection indexes
    await db.assignments.create_index("tutor_id")
    await db.assignments.create_index("student_ids")
    await db.assignments.create_index("due_date")
    await db.assignments.create_index("status")
    
    # Progress collection indexes
    await db.progress.create_index([("student_id", 1), ("assignment_id", 1)], unique=True)
    await db.progress.create_index("student_id")
    await db.progress.create_index("assignment_id")
    
    # Student groups collection indexes
    await db.student_groups.create_index("tutor_id")


async def down(db: AsyncIOMotorDatabase):
    """Remove indexes (Note: This is destructive)"""
    # In practice, we rarely want to drop indexes in production
    pass


migration = Migration(
    version="001",
    name="initial_indexes",
    description="Create initial database indexes for all collections",
    up=up,
    down=down
)

