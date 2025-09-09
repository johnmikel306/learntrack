#!/usr/bin/env python3
"""
Migration script to rename tenant_id fields to tutor_id in all collections
"""
import asyncio
import sys
import os
from datetime import datetime
from typing import List, Dict, Any

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import structlog

logger = structlog.get_logger()

# Collections that need tenant_id -> tutor_id migration
COLLECTIONS_TO_MIGRATE = [
    "students",
    "subjects", 
    "questions",
    "assignments",
    "progress",
    "files",
    "student_groups",
    "users"
]

class TenantToTutorMigration:
    """Migration class to handle tenant_id to tutor_id field renaming"""
    
    def __init__(self):
        self.client = None
        self.db = None
        
    async def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URL)
            self.db = self.client[settings.DATABASE_NAME]
            logger.info("Connected to MongoDB", database=settings.DATABASE_NAME)
        except Exception as e:
            logger.error("Failed to connect to MongoDB", error=str(e))
            raise
    
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    async def check_collection_exists(self, collection_name: str) -> bool:
        """Check if collection exists"""
        collections = await self.db.list_collection_names()
        return collection_name in collections
    
    async def count_documents_with_tenant_id(self, collection_name: str) -> int:
        """Count documents that have tenant_id field"""
        collection = self.db[collection_name]
        count = await collection.count_documents({"tenant_id": {"$exists": True}})
        return count
    
    async def count_documents_with_tutor_id(self, collection_name: str) -> int:
        """Count documents that have tutor_id field"""
        collection = self.db[collection_name]
        count = await collection.count_documents({"tutor_id": {"$exists": True}})
        return count
    
    async def backup_collection(self, collection_name: str) -> str:
        """Create a backup of the collection before migration"""
        backup_name = f"{collection_name}_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        try:
            # Use MongoDB aggregation to copy collection
            collection = self.db[collection_name]
            backup_collection = self.db[backup_name]
            
            # Copy all documents
            async for doc in collection.find():
                await backup_collection.insert_one(doc)
            
            logger.info("Created backup collection", 
                       original=collection_name, 
                       backup=backup_name)
            return backup_name
            
        except Exception as e:
            logger.error("Failed to create backup", 
                        collection=collection_name, 
                        error=str(e))
            raise
    
    async def migrate_collection(self, collection_name: str, create_backup: bool = True) -> Dict[str, Any]:
        """Migrate a single collection from tenant_id to tutor_id"""
        logger.info("Starting migration for collection", collection=collection_name)
        
        collection = self.db[collection_name]
        
        # Check if collection exists
        if not await self.check_collection_exists(collection_name):
            logger.warning("Collection does not exist, skipping", collection=collection_name)
            return {"status": "skipped", "reason": "collection_not_found"}
        
        # Count documents with tenant_id
        tenant_id_count = await self.count_documents_with_tenant_id(collection_name)
        tutor_id_count = await self.count_documents_with_tutor_id(collection_name)
        
        if tenant_id_count == 0:
            logger.info("No documents with tenant_id found, skipping", 
                       collection=collection_name)
            return {"status": "skipped", "reason": "no_tenant_id_fields"}
        
        if tutor_id_count > 0:
            logger.warning("Collection already has tutor_id fields", 
                          collection=collection_name,
                          tutor_id_count=tutor_id_count)
            # Continue with migration but log the warning
        
        # Create backup if requested
        backup_name = None
        if create_backup:
            backup_name = await self.backup_collection(collection_name)
        
        try:
            # Perform the field rename using MongoDB's $rename operator
            result = await collection.update_many(
                {"tenant_id": {"$exists": True}},
                {"$rename": {"tenant_id": "tutor_id"}}
            )
            
            logger.info("Migration completed for collection",
                       collection=collection_name,
                       matched_count=result.matched_count,
                       modified_count=result.modified_count,
                       backup=backup_name)
            
            return {
                "status": "success",
                "matched_count": result.matched_count,
                "modified_count": result.modified_count,
                "backup_collection": backup_name
            }
            
        except Exception as e:
            logger.error("Migration failed for collection",
                        collection=collection_name,
                        error=str(e))
            raise
    
    async def verify_migration(self, collection_name: str) -> Dict[str, Any]:
        """Verify that migration was successful"""
        tenant_id_count = await self.count_documents_with_tenant_id(collection_name)
        tutor_id_count = await self.count_documents_with_tutor_id(collection_name)
        
        return {
            "collection": collection_name,
            "tenant_id_remaining": tenant_id_count,
            "tutor_id_count": tutor_id_count,
            "migration_complete": tenant_id_count == 0
        }
    
    async def run_full_migration(self, create_backups: bool = True) -> Dict[str, Any]:
        """Run migration for all collections"""
        logger.info("Starting full tenant_id to tutor_id migration")
        
        results = {}
        
        for collection_name in COLLECTIONS_TO_MIGRATE:
            try:
                migration_result = await self.migrate_collection(collection_name, create_backups)
                verification_result = await self.verify_migration(collection_name)
                
                results[collection_name] = {
                    "migration": migration_result,
                    "verification": verification_result
                }
                
            except Exception as e:
                logger.error("Failed to migrate collection", 
                           collection=collection_name, 
                           error=str(e))
                results[collection_name] = {
                    "migration": {"status": "failed", "error": str(e)},
                    "verification": None
                }
        
        return results

async def main():
    """Main migration function"""
    migration = TenantToTutorMigration()
    
    try:
        await migration.connect()
        
        # Run the migration
        results = await migration.run_full_migration(create_backups=True)
        
        # Print summary
        print("\n" + "="*60)
        print("MIGRATION SUMMARY")
        print("="*60)
        
        for collection_name, result in results.items():
            migration_result = result["migration"]
            verification_result = result["verification"]
            
            print(f"\nCollection: {collection_name}")
            print(f"  Status: {migration_result['status']}")
            
            if migration_result["status"] == "success":
                print(f"  Documents modified: {migration_result['modified_count']}")
                print(f"  Backup created: {migration_result.get('backup_collection', 'N/A')}")
                
                if verification_result:
                    print(f"  Verification: {'✓ PASSED' if verification_result['migration_complete'] else '✗ FAILED'}")
                    print(f"  Remaining tenant_id fields: {verification_result['tenant_id_remaining']}")
                    print(f"  Total tutor_id fields: {verification_result['tutor_id_count']}")
            
            elif migration_result["status"] == "skipped":
                print(f"  Reason: {migration_result['reason']}")
            
            elif migration_result["status"] == "failed":
                print(f"  Error: {migration_result['error']}")
        
        print("\n" + "="*60)
        
    except Exception as e:
        logger.error("Migration failed", error=str(e))
        print(f"Migration failed: {e}")
        sys.exit(1)
    
    finally:
        await migration.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
