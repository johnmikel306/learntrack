"""
Admin Tenant Management API endpoints
Provides tenant (tutor) management for super admins
"""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import structlog

from app.core.database import get_database
from app.core.enhanced_auth import require_super_admin, ClerkUserContext, require_admin_permission
from app.models.user import AdminPermission
from app.models.admin import (
    TenantInfo, TenantListResponse, TenantStatus,
    TenantSuspendRequest, TenantActivateRequest,
    AuditLog, AuditAction
)

logger = structlog.get_logger()
router = APIRouter()


async def _log_admin_action(
    database: AsyncIOMotorDatabase,
    admin_id: str,
    admin_email: str,
    action: AuditAction,
    target_type: str,
    target_id: str = None,
    details: dict = None
):
    """Log admin action for audit trail"""
    try:
        await database.admin_audit_logs.insert_one({
            "admin_id": admin_id,
            "admin_email": admin_email,
            "action": action.value,
            "target_type": target_type,
            "target_id": target_id,
            "details": details or {},
            "timestamp": datetime.now(timezone.utc)
        })
    except Exception as e:
        logger.warning("Failed to log admin action", error=str(e))


@router.get("/", response_model=TenantListResponse)
async def list_tenants(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: Optional[TenantStatus] = Query(None),
    search: Optional[str] = Query(None, description="Search by name or email"),
    current_user: ClerkUserContext = Depends(require_admin_permission(AdminPermission.VIEW_ALL_TENANTS)),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """List all tenants (tutors) with statistics"""
    try:
        skip = (page - 1) * per_page
        query = {}
        
        if status_filter:
            query["status"] = status_filter.value
        
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
        
        # Get total count
        total = await database.tutors.count_documents(query)
        
        # Get tutors with pagination
        cursor = database.tutors.find(query).sort("created_at", -1).skip(skip).limit(per_page)
        tutors = await cursor.to_list(length=per_page)
        
        # Enrich with statistics
        tenant_infos = []
        for tutor in tutors:
            tutor_id = tutor.get("clerk_id")
            
            # Get counts for this tutor's tenant
            students_count = await database.students.count_documents({"tutor_id": tutor_id})
            parents_count = await database.parents.count_documents({"tutor_id": tutor_id})
            subjects_count = await database.subjects.count_documents({"tutor_id": tutor_id})
            questions_count = await database.questions.count_documents({"tutor_id": tutor_id})
            assignments_count = await database.assignments.count_documents({"tutor_id": tutor_id})
            
            tenant_info = TenantInfo(
                _id=str(tutor["_id"]),
                clerk_id=tutor_id,
                email=tutor.get("email", ""),
                name=tutor.get("name", "Unknown"),
                status=TenantStatus(tutor.get("status", "active")),
                created_at=tutor.get("created_at", datetime.now(timezone.utc)),
                updated_at=tutor.get("updated_at", datetime.now(timezone.utc)),
                last_login=tutor.get("last_login"),
                students_count=students_count,
                parents_count=parents_count,
                subjects_count=subjects_count,
                questions_count=questions_count,
                assignments_count=assignments_count,
                subscription_tier=tutor.get("subscription_tier", "free"),
                storage_used_mb=tutor.get("storage_used_mb", 0.0),
                storage_limit_mb=tutor.get("storage_limit_mb", 500.0)
            )
            tenant_infos.append(tenant_info)
        
        total_pages = (total + per_page - 1) // per_page
        
        return TenantListResponse(
            tenants=tenant_infos,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
    except Exception as e:
        logger.error("Failed to list tenants", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to list tenants: {str(e)}")


@router.get("/{tenant_id}", response_model=TenantInfo)
async def get_tenant_details(
    tenant_id: str,
    current_user: ClerkUserContext = Depends(require_admin_permission(AdminPermission.VIEW_ALL_TENANTS)),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get detailed information about a specific tenant"""
    try:
        # Find tutor by clerk_id or _id
        tutor = await database.tutors.find_one({"clerk_id": tenant_id})
        if not tutor:
            try:
                tutor = await database.tutors.find_one({"_id": ObjectId(tenant_id)})
            except Exception:
                pass
        
        if not tutor:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        tutor_id = tutor.get("clerk_id")
        
        # Get counts
        students_count = await database.students.count_documents({"tutor_id": tutor_id})
        parents_count = await database.parents.count_documents({"tutor_id": tutor_id})
        subjects_count = await database.subjects.count_documents({"tutor_id": tutor_id})
        questions_count = await database.questions.count_documents({"tutor_id": tutor_id})
        assignments_count = await database.assignments.count_documents({"tutor_id": tutor_id})
        
        # Log the view action
        await _log_admin_action(
            database, current_user.clerk_id, current_user.email,
            AuditAction.TENANT_VIEWED, "tenant", tutor_id
        )
        
        return TenantInfo(
            _id=str(tutor["_id"]),
            clerk_id=tutor_id,
            email=tutor.get("email", ""),
            name=tutor.get("name", "Unknown"),
            status=TenantStatus(tutor.get("status", "active")),
            created_at=tutor.get("created_at", datetime.now(timezone.utc)),
            updated_at=tutor.get("updated_at", datetime.now(timezone.utc)),
            last_login=tutor.get("last_login"),
            students_count=students_count,
            parents_count=parents_count,
            subjects_count=subjects_count,
            questions_count=questions_count,
            assignments_count=assignments_count
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get tenant details", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get tenant: {str(e)}")


@router.post("/{tenant_id}/suspend")
async def suspend_tenant(
    tenant_id: str,
    request: TenantSuspendRequest,
    current_user: ClerkUserContext = Depends(require_admin_permission(AdminPermission.SUSPEND_TENANTS)),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Suspend a tenant (tutor) account"""
    try:
        # Find and update tutor
        result = await database.tutors.update_one(
            {"clerk_id": tenant_id},
            {
                "$set": {
                    "status": TenantStatus.SUSPENDED.value,
                    "suspended_at": datetime.now(timezone.utc),
                    "suspension_reason": request.reason,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Tenant not found")

        # Log the action
        await _log_admin_action(
            database, current_user.clerk_id, current_user.email,
            AuditAction.TENANT_SUSPENDED, "tenant", tenant_id,
            {"reason": request.reason, "notify_users": request.notify_users}
        )

        logger.info("Tenant suspended", tenant_id=tenant_id, admin=current_user.email)

        return {"status": "suspended", "tenant_id": tenant_id, "message": "Tenant has been suspended"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to suspend tenant", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to suspend tenant: {str(e)}")


@router.post("/{tenant_id}/activate")
async def activate_tenant(
    tenant_id: str,
    request: TenantActivateRequest,
    current_user: ClerkUserContext = Depends(require_admin_permission(AdminPermission.MANAGE_TENANTS)),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Activate a suspended tenant account"""
    try:
        # Find and update tutor
        result = await database.tutors.update_one(
            {"clerk_id": tenant_id},
            {
                "$set": {
                    "status": TenantStatus.ACTIVE.value,
                    "activated_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                },
                "$unset": {
                    "suspended_at": "",
                    "suspension_reason": ""
                }
            }
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Tenant not found")

        # Log the action
        await _log_admin_action(
            database, current_user.clerk_id, current_user.email,
            AuditAction.TENANT_ACTIVATED, "tenant", tenant_id,
            {"reason": request.reason, "notify_users": request.notify_users}
        )

        logger.info("Tenant activated", tenant_id=tenant_id, admin=current_user.email)

        return {"status": "active", "tenant_id": tenant_id, "message": "Tenant has been activated"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to activate tenant", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to activate tenant: {str(e)}")

