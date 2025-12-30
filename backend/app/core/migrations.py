"""
Database Migration System for MongoDB.
Tracks and applies migrations in order.
"""
import os
import asyncio
from datetime import datetime, timezone
from typing import List, Dict, Any, Callable, Optional
from dataclasses import dataclass
import importlib.util
import structlog

from motor.motor_asyncio import AsyncIOMotorDatabase

logger = structlog.get_logger()

MIGRATIONS_COLLECTION = "_migrations"


@dataclass
class Migration:
    """Represents a database migration"""
    version: str
    name: str
    description: str
    up: Callable[[AsyncIOMotorDatabase], Any]
    down: Optional[Callable[[AsyncIOMotorDatabase], Any]] = None


class MigrationRunner:
    """Runs and tracks database migrations"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self._migrations: List[Migration] = []
    
    def register(self, migration: Migration):
        """Register a migration"""
        self._migrations.append(migration)
        self._migrations.sort(key=lambda m: m.version)
    
    async def get_applied_migrations(self) -> List[str]:
        """Get list of applied migration versions"""
        cursor = self.db[MIGRATIONS_COLLECTION].find({}, {"version": 1})
        docs = await cursor.to_list(length=1000)
        return [doc["version"] for doc in docs]
    
    async def apply_migration(self, migration: Migration) -> bool:
        """Apply a single migration"""
        try:
            logger.info("Applying migration", version=migration.version, name=migration.name)
            
            await migration.up(self.db)
            
            # Record migration as applied
            await self.db[MIGRATIONS_COLLECTION].insert_one({
                "version": migration.version,
                "name": migration.name,
                "description": migration.description,
                "applied_at": datetime.now(timezone.utc)
            })
            
            logger.info("Migration applied successfully", version=migration.version)
            return True
            
        except Exception as e:
            logger.error("Migration failed", version=migration.version, error=str(e))
            return False
    
    async def migrate(self) -> Dict[str, Any]:
        """Run all pending migrations"""
        applied = await self.get_applied_migrations()
        pending = [m for m in self._migrations if m.version not in applied]
        
        if not pending:
            logger.info("No pending migrations")
            return {"applied": 0, "pending": 0}
        
        logger.info("Found pending migrations", count=len(pending))
        
        results = {"applied": 0, "failed": 0, "migrations": []}
        
        for migration in pending:
            success = await self.apply_migration(migration)
            if success:
                results["applied"] += 1
                results["migrations"].append({
                    "version": migration.version,
                    "name": migration.name,
                    "status": "applied"
                })
            else:
                results["failed"] += 1
                results["migrations"].append({
                    "version": migration.version,
                    "name": migration.name,
                    "status": "failed"
                })
                break  # Stop on first failure
        
        return results
    
    async def rollback(self, version: str) -> bool:
        """Rollback a specific migration"""
        migration = next((m for m in self._migrations if m.version == version), None)
        
        if not migration:
            logger.error("Migration not found", version=version)
            return False
        
        if not migration.down:
            logger.error("Migration has no rollback", version=version)
            return False
        
        try:
            logger.info("Rolling back migration", version=version)
            
            await migration.down(self.db)
            
            # Remove migration record
            await self.db[MIGRATIONS_COLLECTION].delete_one({"version": version})
            
            logger.info("Rollback completed", version=version)
            return True
            
        except Exception as e:
            logger.error("Rollback failed", version=version, error=str(e))
            return False
    
    async def status(self) -> Dict[str, Any]:
        """Get migration status"""
        applied = await self.get_applied_migrations()
        
        return {
            "applied_count": len(applied),
            "total_migrations": len(self._migrations),
            "pending_count": len([m for m in self._migrations if m.version not in applied]),
            "migrations": [
                {
                    "version": m.version,
                    "name": m.name,
                    "status": "applied" if m.version in applied else "pending"
                }
                for m in self._migrations
            ]
        }


# Global migration runner instance (initialized with db at startup)
migration_runner: Optional[MigrationRunner] = None


def get_migration_runner(db: AsyncIOMotorDatabase) -> MigrationRunner:
    """Get or create migration runner"""
    global migration_runner
    if migration_runner is None:
        migration_runner = MigrationRunner(db)
        _register_migrations(migration_runner)
    return migration_runner


def _register_migrations(runner: MigrationRunner):
    """Register all migrations"""
    # Import and register migrations from migrations directory
    from app.migrations import get_all_migrations
    for migration in get_all_migrations():
        runner.register(migration)

