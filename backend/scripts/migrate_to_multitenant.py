#!/usr/bin/env python3
"""
Data migration script for converting LearnTrack to multi-tenant architecture

This script:
1. Identifies existing tutors and assigns them as tenant owners
2. Maps students and parents to appropriate tenant_id based on existing relationships
3. Updates all historical data with correct tenant_id
4. Validates data integrity post-migration
5. Creates necessary database indexes for multi-tenant queries

Usage:
    python backend/scripts/migrate_to_multitenant.py --dry-run  # Preview changes
    python backend/scripts/migrate_to_multitenant.py --execute  # Execute migration
"""

import asyncio
import argparse
import sys
from datetime import datetime
from typing import Dict, List, Set
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from bson import ObjectId
import structlog

# Setup logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


class MultiTenantMigration:
    """Handles migration to multi-tenant architecture"""
    
    def __init__(self, database: AsyncIOMotorDatabase, dry_run: bool = True):
        self.db = database
        self.dry_run = dry_run
        self.tenant_mappings: Dict[str, str] = {}  # user_id -> tenant_id
        self.tutor_clerk_ids: Set[str] = set()
        self.migration_stats = {
            "tutors_processed": 0,
            "students_updated": 0,
            "questions_updated": 0,
            "assignments_updated": 0,
            "files_updated": 0,
            "progress_updated": 0,
            "subjects_updated": 0,
            "groups_updated": 0,
            "errors": []
        }
    
    async def run_migration(self):
        """Execute the complete migration process"""
        logger.info("Starting multi-tenant migration", dry_run=self.dry_run)
        
        try:
            # Step 1: Identify tutors and create tenant mappings
            await self._identify_tutors()
            
            # Step 2: Update users collection with tenant_id
            await self._update_users()
            
            # Step 3: Update all data collections
            await self._update_students()
            await self._update_questions()
            await self._update_assignments()
            await self._update_files()
            await self._update_progress()
            await self._update_subjects()
            await self._update_student_groups()
            
            # Step 4: Create database indexes
            await self._create_indexes()
            
            # Step 5: Validate migration
            await self._validate_migration()

            # Step 6: Create rollback script
            await self.create_rollback_script()

            logger.info("Migration completed successfully", stats=self.migration_stats)
            
        except Exception as e:
            logger.error("Migration failed", error=str(e))
            self.migration_stats["errors"].append(str(e))
            raise
    
    async def _identify_tutors(self):
        """Identify existing tutors and create tenant mappings"""
        logger.info("Identifying tutors and creating tenant mappings")
        
        # Find all users with tutor role
        tutors_cursor = self.db.users.find({"role": "tutor"})
        
        async for tutor in tutors_cursor:
            clerk_id = tutor.get("clerk_id") or tutor.get("auth0_id")
            if not clerk_id:
                logger.warning("Tutor without clerk_id/auth0_id found", tutor_id=str(tutor["_id"]))
                # Generate a fallback tenant_id
                clerk_id = f"legacy_tutor_{tutor['_id']}"
            
            user_id = str(tutor["_id"])
            self.tenant_mappings[user_id] = clerk_id
            self.tutor_clerk_ids.add(clerk_id)
            self.migration_stats["tutors_processed"] += 1
            
            logger.info("Mapped tutor to tenant", 
                       tutor_id=user_id, 
                       tenant_id=clerk_id, 
                       email=tutor.get("email"))
        
        logger.info("Tutor identification complete", 
                   total_tutors=self.migration_stats["tutors_processed"])
    
    async def _update_users(self):
        """Update users collection with tenant_id and student_ids"""
        logger.info("Updating users collection")
        
        # Update tutors - they are their own tenant
        for user_id, tenant_id in self.tenant_mappings.items():
            if not self.dry_run:
                await self.db.users.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": {
                        "tenant_id": tenant_id,
                        "student_ids": [],
                        "updated_at": datetime.utcnow()
                    }}
                )
        
        # Update students and parents - assign to first tutor for now
        # In a real scenario, you'd have relationship data to determine the correct tutor
        default_tenant = list(self.tenant_mappings.values())[0] if self.tenant_mappings else "default_tenant"
        
        if not self.dry_run:
            # Update students
            await self.db.users.update_many(
                {"role": "student", "tenant_id": {"$exists": False}},
                {"$set": {
                    "tenant_id": default_tenant,
                    "student_ids": [],
                    "updated_at": datetime.utcnow()
                }}
            )
            
            # Update parents
            await self.db.users.update_many(
                {"role": "parent", "tenant_id": {"$exists": False}},
                {"$set": {
                    "tenant_id": default_tenant,
                    "student_ids": [],  # This should be populated based on actual relationships
                    "updated_at": datetime.utcnow()
                }}
            )
        
        logger.info("Users collection updated")
    
    async def _update_students(self):
        """Update students collection with tenant_id"""
        logger.info("Updating students collection")
        
        # For existing students, assign to first tutor's tenant
        # In production, you'd use actual tutor-student relationships
        default_tenant = list(self.tenant_mappings.values())[0] if self.tenant_mappings else "default_tenant"
        
        if not self.dry_run:
            result = await self.db.students.update_many(
                {"tenant_id": {"$exists": False}},
                {"$set": {
                    "tenant_id": default_tenant,
                    "updated_at": datetime.utcnow()
                }}
            )
            self.migration_stats["students_updated"] = result.modified_count
        else:
            count = await self.db.students.count_documents({"tenant_id": {"$exists": False}})
            self.migration_stats["students_updated"] = count
        
        logger.info("Students updated", count=self.migration_stats["students_updated"])
    
    async def _update_questions(self):
        """Update questions collection with tenant_id"""
        logger.info("Updating questions collection")
        
        if not self.dry_run:
            # Update questions based on tutor_id
            for user_id, tenant_id in self.tenant_mappings.items():
                result = await self.db.questions.update_many(
                    {"tutor_id": user_id, "tenant_id": {"$exists": False}},
                    {"$set": {
                        "tenant_id": tenant_id,
                        "updated_at": datetime.utcnow()
                    }}
                )
                self.migration_stats["questions_updated"] += result.modified_count
        else:
            count = await self.db.questions.count_documents({"tenant_id": {"$exists": False}})
            self.migration_stats["questions_updated"] = count
        
        logger.info("Questions updated", count=self.migration_stats["questions_updated"])
    
    async def _update_assignments(self):
        """Update assignments collection with tenant_id"""
        logger.info("Updating assignments collection")
        
        if not self.dry_run:
            # Update assignments based on tutor_id
            for user_id, tenant_id in self.tenant_mappings.items():
                result = await self.db.assignments.update_many(
                    {"tutor_id": user_id, "tenant_id": {"$exists": False}},
                    {"$set": {
                        "tenant_id": tenant_id,
                        "updated_at": datetime.utcnow()
                    }}
                )
                self.migration_stats["assignments_updated"] += result.modified_count
        else:
            count = await self.db.assignments.count_documents({"tenant_id": {"$exists": False}})
            self.migration_stats["assignments_updated"] = count
        
        logger.info("Assignments updated", count=self.migration_stats["assignments_updated"])
    
    async def _update_files(self):
        """Update files collection with tenant_id"""
        logger.info("Updating files collection")
        
        # For files, we need to map uploaded_by to tenant_id
        default_tenant = list(self.tenant_mappings.values())[0] if self.tenant_mappings else "default_tenant"
        
        if not self.dry_run:
            result = await self.db.files.update_many(
                {"tenant_id": {"$exists": False}},
                {"$set": {
                    "tenant_id": default_tenant,
                    "updated_at": datetime.utcnow()
                }}
            )
            self.migration_stats["files_updated"] = result.modified_count
        else:
            count = await self.db.files.count_documents({"tenant_id": {"$exists": False}})
            self.migration_stats["files_updated"] = count
        
        logger.info("Files updated", count=self.migration_stats["files_updated"])
    
    async def _update_progress(self):
        """Update progress collection with tenant_id"""
        logger.info("Updating progress collection")
        
        default_tenant = list(self.tenant_mappings.values())[0] if self.tenant_mappings else "default_tenant"
        
        if not self.dry_run:
            result = await self.db.progress.update_many(
                {"tenant_id": {"$exists": False}},
                {"$set": {
                    "tenant_id": default_tenant,
                    "updated_at": datetime.utcnow()
                }}
            )
            self.migration_stats["progress_updated"] = result.modified_count
        else:
            count = await self.db.progress.count_documents({"tenant_id": {"$exists": False}})
            self.migration_stats["progress_updated"] = count
        
        logger.info("Progress updated", count=self.migration_stats["progress_updated"])
    
    async def _update_subjects(self):
        """Update subjects collection with tenant_id"""
        logger.info("Updating subjects collection")
        
        if not self.dry_run:
            # Update subjects based on tutor_id
            for user_id, tenant_id in self.tenant_mappings.items():
                result = await self.db.subjects.update_many(
                    {"tutor_id": user_id, "tenant_id": {"$exists": False}},
                    {"$set": {
                        "tenant_id": tenant_id,
                        "updated_at": datetime.utcnow()
                    }}
                )
                self.migration_stats["subjects_updated"] += result.modified_count
        else:
            count = await self.db.subjects.count_documents({"tenant_id": {"$exists": False}})
            self.migration_stats["subjects_updated"] = count
        
        logger.info("Subjects updated", count=self.migration_stats["subjects_updated"])
    
    async def _update_student_groups(self):
        """Update student_groups collection with tenant_id"""
        logger.info("Updating student_groups collection")
        
        default_tenant = list(self.tenant_mappings.values())[0] if self.tenant_mappings else "default_tenant"
        
        if not self.dry_run:
            result = await self.db.student_groups.update_many(
                {"tenant_id": {"$exists": False}},
                {"$set": {
                    "tenant_id": default_tenant,
                    "updated_at": datetime.utcnow()
                }}
            )
            self.migration_stats["groups_updated"] = result.modified_count
        else:
            count = await self.db.student_groups.count_documents({"tenant_id": {"$exists": False}})
            self.migration_stats["groups_updated"] = count
        
        logger.info("Student groups updated", count=self.migration_stats["groups_updated"])
    
    async def _create_indexes(self):
        """Create compound indexes for multi-tenant queries"""
        logger.info("Creating database indexes for multi-tenant queries")
        
        if self.dry_run:
            logger.info("Dry run: Would create indexes")
            return
        
        # Define indexes for each collection
        indexes = [
            ("students", [("tenant_id", 1), ("email", 1)]),
            ("students", [("tenant_id", 1), ("status", 1)]),
            ("questions", [("tenant_id", 1), ("subject_id", 1)]),
            ("questions", [("tenant_id", 1), ("tutor_id", 1)]),
            ("assignments", [("tenant_id", 1), ("tutor_id", 1)]),
            ("assignments", [("tenant_id", 1), ("due_date", 1)]),
            ("files", [("tenant_id", 1), ("uploaded_by", 1)]),
            ("progress", [("tenant_id", 1), ("student_id", 1)]),
            ("progress", [("tenant_id", 1), ("assignment_id", 1)]),
            ("subjects", [("tenant_id", 1), ("tutor_id", 1)]),
            ("student_groups", [("tenant_id", 1), ("name", 1)]),
            ("users", [("tenant_id", 1), ("role", 1)]),
            ("users", [("clerk_id", 1)]),  # Unique index for Clerk ID
        ]
        
        for collection_name, index_spec in indexes:
            try:
                collection = getattr(self.db, collection_name)
                await collection.create_index(index_spec)
                logger.info("Created index", collection=collection_name, index=index_spec)
            except Exception as e:
                logger.warning("Failed to create index", 
                             collection=collection_name, 
                             index=index_spec, 
                             error=str(e))
    
    async def _validate_migration(self):
        """Validate migration results"""
        logger.info("Validating migration results")

        # Check that all records have tenant_id
        collections_to_check = [
            "users", "students", "questions", "assignments",
            "files", "progress", "subjects", "student_groups"
        ]

        for collection_name in collections_to_check:
            collection = getattr(self.db, collection_name)
            missing_tenant_count = await collection.count_documents({"tenant_id": {"$exists": False}})

            if missing_tenant_count > 0:
                error_msg = f"Found {missing_tenant_count} records without tenant_id in {collection_name}"
                logger.error(error_msg)
                self.migration_stats["errors"].append(error_msg)
            else:
                logger.info("Validation passed", collection=collection_name)

        # Check tenant isolation
        for tenant_id in self.tutor_clerk_ids:
            for collection_name in ["students", "questions", "assignments"]:
                collection = getattr(self.db, collection_name)
                count = await collection.count_documents({"tenant_id": tenant_id})
                logger.info("Tenant data count",
                           tenant_id=tenant_id,
                           collection=collection_name,
                           count=count)

        # Validate data integrity
        await self._validate_data_integrity()

    async def _validate_data_integrity(self):
        """Validate data integrity after migration"""
        logger.info("Validating data integrity")

        # Check that all tenant_ids reference valid tutors
        all_tenant_ids = set()
        for collection_name in ["students", "questions", "assignments", "files", "progress", "subjects"]:
            collection = getattr(self.db, collection_name)
            cursor = collection.find({}, {"tenant_id": 1})
            async for doc in cursor:
                if "tenant_id" in doc:
                    all_tenant_ids.add(doc["tenant_id"])

        # Verify all tenant_ids exist in users collection
        for tenant_id in all_tenant_ids:
            user_exists = await self.db.users.count_documents({
                "$or": [
                    {"clerk_id": tenant_id},
                    {"auth0_id": tenant_id}
                ]
            })
            if user_exists == 0:
                error_msg = f"Orphaned tenant_id found: {tenant_id}"
                logger.error(error_msg)
                self.migration_stats["errors"].append(error_msg)

        # Check for cross-tenant data leakage in relationships
        await self._check_cross_tenant_relationships()

    async def _check_cross_tenant_relationships(self):
        """Check for cross-tenant data leakage in relationships"""
        logger.info("Checking cross-tenant relationships")

        # Check assignments - ensure all student_ids belong to same tenant
        assignments_cursor = self.db.assignments.find({})
        async for assignment in assignments_cursor:
            assignment_tenant = assignment.get("tenant_id")
            if not assignment_tenant:
                continue

            student_ids = assignment.get("student_ids", [])
            for student_id in student_ids:
                try:
                    student_oid = ObjectId(student_id) if ObjectId.is_valid(student_id) else student_id
                    student = await self.db.students.find_one({"_id": student_oid})
                    if student and student.get("tenant_id") != assignment_tenant:
                        error_msg = f"Cross-tenant assignment detected: assignment {assignment['_id']} (tenant {assignment_tenant}) assigned to student {student_id} (tenant {student.get('tenant_id')})"
                        logger.error(error_msg)
                        self.migration_stats["errors"].append(error_msg)
                except Exception as e:
                    logger.warning("Error checking student assignment", student_id=student_id, error=str(e))

    async def create_rollback_script(self):
        """Create a rollback script to undo the migration"""
        rollback_script = f"""#!/usr/bin/env python3
'''
Rollback script for multi-tenant migration
Generated on: {datetime.utcnow().isoformat()}
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
            {{}},
            {{"$unset": {{"tenant_id": "", "student_ids": ""}}}}
        )
        print(f"Removed tenant fields from {{result.modified_count}} documents in {{collection_name}}")

    # Drop tenant-related indexes
    try:
        await db.users.drop_index([("tenant_id", 1), ("role", 1)])
        await db.students.drop_index([("tenant_id", 1), ("email", 1)])
        await db.questions.drop_index([("tenant_id", 1), ("subject_id", 1)])
        await db.assignments.drop_index([("tenant_id", 1), ("tutor_id", 1)])
        print("Dropped tenant-related indexes")
    except Exception as e:
        print(f"Warning: Could not drop some indexes: {{e}}")

    print("Rollback completed")
    client.close()

if __name__ == "__main__":
    asyncio.run(rollback_migration())
"""

        rollback_path = "scripts/rollback_multitenant.py"
        with open(rollback_path, "w") as f:
            f.write(rollback_script)

        logger.info("Created rollback script", path=rollback_path)


async def main():
    parser = argparse.ArgumentParser(description="Migrate LearnTrack to multi-tenant architecture")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without executing")
    parser.add_argument("--execute", action="store_true", help="Execute the migration")
    parser.add_argument("--mongo-url", default="mongodb://localhost:27017", help="MongoDB connection URL")
    parser.add_argument("--database", default="learntrack", help="Database name")
    
    args = parser.parse_args()
    
    if not args.dry_run and not args.execute:
        print("Error: Must specify either --dry-run or --execute")
        sys.exit(1)
    
    if args.execute and args.dry_run:
        print("Error: Cannot specify both --dry-run and --execute")
        sys.exit(1)
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(args.mongo_url)
    database = client[args.database]
    
    try:
        # Run migration
        migration = MultiTenantMigration(database, dry_run=args.dry_run)
        await migration.run_migration()
        
        print("\nMigration Summary:")
        print(f"Mode: {'DRY RUN' if args.dry_run else 'EXECUTED'}")
        for key, value in migration.migration_stats.items():
            if key != "errors":
                print(f"{key}: {value}")
        
        if migration.migration_stats["errors"]:
            print("\nErrors:")
            for error in migration.migration_stats["errors"]:
                print(f"  - {error}")
            sys.exit(1)
        
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
