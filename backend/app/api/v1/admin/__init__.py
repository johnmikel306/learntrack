"""
Admin API endpoints for super admin functionality
"""
from fastapi import APIRouter

from app.api.v1.admin import dashboard, tenants, users, settings as admin_settings

admin_router = APIRouter(prefix="/admin", tags=["admin"])

# Include all admin endpoint routers
admin_router.include_router(dashboard.router, prefix="/dashboard", tags=["admin-dashboard"])
admin_router.include_router(tenants.router, prefix="/tenants", tags=["admin-tenants"])
admin_router.include_router(users.router, prefix="/users", tags=["admin-users"])
admin_router.include_router(admin_settings.router, prefix="/settings", tags=["admin-settings"])

