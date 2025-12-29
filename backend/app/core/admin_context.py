"""
Super Admin Context for cross-tenant operations
Provides database wrappers that bypass tenant isolation for admin users
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from fastapi import HTTPException, status
import structlog
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorCollection

from app.models.user import UserRole, AdminPermission
from app.models.admin import AuditLog, AuditAction

logger = structlog.get_logger()


class SuperAdminContext:
    """Context object for super admin cross-tenant operations"""

    def __init__(self, admin_id: str, admin_email: str, permissions: List[AdminPermission]):
        self.admin_id = admin_id
        self.admin_email = admin_email
        self.permissions = permissions
        self.has_full_access = AdminPermission.FULL_ACCESS in permissions
        # Optional tenant targeting for scoped operations
        self.target_tenant_id: Optional[str] = None

    def has_permission(self, permission: AdminPermission) -> bool:
        """Check if admin has a specific permission"""
        if self.has_full_access:
            return True
        return permission in self.permissions

    def require_permission(self, permission: AdminPermission):
        """Raise exception if admin doesn't have required permission"""
        if not self.has_permission(permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing admin permission: {permission.value}"
            )

    def set_target_tenant(self, tenant_id: str):
        """Set target tenant for scoped operations"""
        self.target_tenant_id = tenant_id


class SuperAdminCollection:
    """
    Collection wrapper for super admin operations.
    Bypasses tenant filtering but logs all operations for audit.
    """
    
    def __init__(
        self, 
        collection: AsyncIOMotorCollection, 
        admin_context: SuperAdminContext,
        audit_collection: Optional[AsyncIOMotorCollection] = None
    ):
        self._collection = collection
        self._admin_context = admin_context
        self._audit_collection = audit_collection
    
    async def _log_operation(self, operation: str, filter_dict: Dict = None, count: int = 0):
        """Log admin database operation for audit"""
        if self._audit_collection:
            try:
                await self._audit_collection.insert_one({
                    "admin_id": self._admin_context.admin_id,
                    "admin_email": self._admin_context.admin_email,
                    "operation": operation,
                    "collection": self._collection.name,
                    "filter": str(filter_dict) if filter_dict else None,
                    "affected_count": count,
                    "target_tenant": self._admin_context.target_tenant_id,
                    "timestamp": datetime.now(timezone.utc)
                })
            except Exception as e:
                logger.warning("Failed to log admin operation", error=str(e))

    def _apply_tenant_scope(self, filter_dict: Optional[Dict] = None) -> Dict:
        """Apply tenant scope if target_tenant_id is set"""
        if filter_dict is None:
            filter_dict = {}
        if self._admin_context.target_tenant_id:
            filter_dict["tutor_id"] = self._admin_context.target_tenant_id
        return filter_dict
    
    async def find_one(self, filter_dict: Optional[Dict[str, Any]] = None, *args, **kwargs):
        """Find one document - no tenant filtering (admin access)"""
        scoped_filter = self._apply_tenant_scope(filter_dict)
        await self._log_operation("find_one", scoped_filter)
        return await self._collection.find_one(scoped_filter, *args, **kwargs)
    
    def find(self, filter_dict: Optional[Dict[str, Any]] = None, *args, **kwargs):
        """Find documents - no tenant filtering (admin access)"""
        scoped_filter = self._apply_tenant_scope(filter_dict)
        # Note: Can't await here as find returns a cursor
        return self._collection.find(scoped_filter, *args, **kwargs)
    
    async def count_documents(self, filter_dict: Optional[Dict[str, Any]] = None):
        """Count documents - no tenant filtering"""
        scoped_filter = self._apply_tenant_scope(filter_dict) if filter_dict else {}
        return await self._collection.count_documents(scoped_filter)
    
    async def aggregate(self, pipeline: list, *args, **kwargs):
        """Aggregate - optionally scope to target tenant"""
        if self._admin_context.target_tenant_id:
            tenant_match = {"$match": {"tutor_id": self._admin_context.target_tenant_id}}
            pipeline = [tenant_match] + pipeline
        await self._log_operation("aggregate", {"pipeline_stages": len(pipeline)})
        return self._collection.aggregate(pipeline, *args, **kwargs)
    
    async def update_one(self, filter_dict: Dict, update: Dict, *args, **kwargs):
        """Update one document with audit logging"""
        scoped_filter = self._apply_tenant_scope(filter_dict)
        result = await self._collection.update_one(scoped_filter, update, *args, **kwargs)
        await self._log_operation("update_one", scoped_filter, result.modified_count)
        return result
    
    async def update_many(self, filter_dict: Dict, update: Dict, *args, **kwargs):
        """Update many documents with audit logging"""
        scoped_filter = self._apply_tenant_scope(filter_dict)
        result = await self._collection.update_many(scoped_filter, update, *args, **kwargs)
        await self._log_operation("update_many", scoped_filter, result.modified_count)
        return result

    async def delete_one(self, filter_dict: Dict, *args, **kwargs):
        """Delete one document with audit logging"""
        scoped_filter = self._apply_tenant_scope(filter_dict)
        result = await self._collection.delete_one(scoped_filter, *args, **kwargs)
        await self._log_operation("delete_one", scoped_filter, result.deleted_count)
        return result

    async def delete_many(self, filter_dict: Dict, *args, **kwargs):
        """Delete many documents with audit logging"""
        scoped_filter = self._apply_tenant_scope(filter_dict)
        result = await self._collection.delete_many(scoped_filter, *args, **kwargs)
        await self._log_operation("delete_many", scoped_filter, result.deleted_count)
        return result


class SuperAdminDatabase:
    """
    Database wrapper for super admin operations.
    Provides access to all collections without tenant filtering.
    """

    def __init__(self, database: AsyncIOMotorDatabase, admin_context: SuperAdminContext):
        self._database = database
        self._admin_context = admin_context
        self._audit_collection = database.get_collection("admin_audit_logs")

    def __getattr__(self, name: str):
        """Get collection with super admin access"""
        if name.startswith('_'):
            return getattr(self._database, name)

        collection = getattr(self._database, name)
        return SuperAdminCollection(collection, self._admin_context, self._audit_collection)

    def get_collection(self, name: str) -> SuperAdminCollection:
        """Get collection with super admin access"""
        collection = self._database.get_collection(name)
        return SuperAdminCollection(collection, self._admin_context, self._audit_collection)

    def get_raw_collection(self, name: str) -> AsyncIOMotorCollection:
        """Get raw collection without wrapper (use carefully)"""
        return self._database.get_collection(name)

    @property
    def raw_database(self) -> AsyncIOMotorDatabase:
        """Get raw database for advanced operations"""
        return self._database


def get_super_admin_database(
    database: AsyncIOMotorDatabase,
    admin_id: str,
    admin_email: str,
    permissions: List[AdminPermission]
) -> SuperAdminDatabase:
    """Factory function to create super admin database wrapper"""
    admin_context = SuperAdminContext(admin_id, admin_email, permissions)
    return SuperAdminDatabase(database, admin_context)

