#!/usr/bin/env python3
'''
Rollback script for multi-tenant migration
Generated on: 2025-08-31T16:39:46.672664
'''

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def rollback_migration():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.learntrack

    print("Rolling back multi-tenant migration...")

    # Remove tenant_id and student_ids fields from all collections
    collections = ["users", "students", "questions", "assignments", "files", "progress", "subjects", "student_groups"]

    for collection_name in collections:
        collection = getattr(db, collection_name)
        result = await collection.update_many(
            {},
            {"$unset": {"tenant_id": "", "student_ids": ""}}
        )
        print(f"Removed tenant fields from {result.modified_count} documents in {collection_name}")

    # Drop tenant-related indexes
    try:
        await db.users.drop_index([("tenant_id", 1), ("role", 1)])
        await db.students.drop_index([("tenant_id", 1), ("email", 1)])
        await db.questions.drop_index([("tenant_id", 1), ("subject_id", 1)])
        await db.assignments.drop_index([("tenant_id", 1), ("tutor_id", 1)])
        print("Dropped tenant-related indexes")
    except Exception as e:
        print(f"Warning: Could not drop some indexes: {e}")

    print("Rollback completed")
    client.close()

if __name__ == "__main__":
    asyncio.run(rollback_migration())
