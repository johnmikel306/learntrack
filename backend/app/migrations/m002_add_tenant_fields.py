"""
Migration 002: Add tenant fields to collections
Ensures all collections have proper tenant_id/tutor_id fields for isolation.
"""
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.migrations import Migration


async def up(db: AsyncIOMotorDatabase):
    """Add tenant fields and indexes to collections missing them"""
    
    # Files collection - ensure tenant isolation
    await db.files.create_index("tutor_id")
    await db.files.create_index("uploaded_by")
    await db.files.create_index([("tutor_id", 1), ("status", 1)])
    await db.files.create_index([("tutor_id", 1), ("created_at", -1)])
    
    # Topics collection - ensure tenant isolation
    await db.topics.create_index("tutor_id")
    await db.topics.create_index("subject_id")
    await db.topics.create_index([("tutor_id", 1), ("subject_id", 1)])
    await db.topics.create_index([("tutor_id", 1), ("name", 1)])
    
    # Materials collection
    await db.materials.create_index("tutor_id")
    await db.materials.create_index("subject_id")
    await db.materials.create_index("material_type")
    await db.materials.create_index("status")
    await db.materials.create_index([("tutor_id", 1), ("created_at", -1)])
    await db.materials.create_index([("tutor_id", 1), ("subject_id", 1)])
    
    # Conversations collection
    await db.conversations.create_index("tutor_id")
    await db.conversations.create_index("participants")
    await db.conversations.create_index([("tutor_id", 1), ("updated_at", -1)])
    
    # Messages collection
    await db.messages.create_index("conversation_id")
    await db.messages.create_index("tutor_id")
    await db.messages.create_index([("conversation_id", 1), ("created_at", -1)])
    await db.messages.create_index("sender_id")
    
    # Invitations collection
    await db.invitations.create_index("tutor_id")
    await db.invitations.create_index("token", unique=True)
    await db.invitations.create_index("invitee_email")
    await db.invitations.create_index("status")
    await db.invitations.create_index("expires_at")
    await db.invitations.create_index([("tutor_id", 1), ("status", 1)])
    await db.invitations.create_index([("tutor_id", 1), ("created_at", -1)])


async def down(db: AsyncIOMotorDatabase):
    """Rollback - no action needed as we don't want to drop indexes"""
    pass


migration = Migration(
    version="002",
    name="add_tenant_fields",
    description="Add tenant isolation indexes to files, topics, materials, conversations, messages, invitations",
    up=up,
    down=down
)

