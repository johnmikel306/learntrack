"""
Admin Dashboard API endpoints
Provides system-wide metrics and overview for super admins
"""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog

from app.core.database import get_database
from app.core.enhanced_auth import require_super_admin, ClerkUserContext, require_admin_permission
from app.models.user import AdminPermission
from app.models.admin import SystemMetrics, AuditLogListResponse, AuditLog

logger = structlog.get_logger()
router = APIRouter()


@router.get("/metrics", response_model=SystemMetrics)
async def get_system_metrics(
    current_user: ClerkUserContext = Depends(require_super_admin),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get system-wide metrics for admin dashboard"""
    try:
        # User counts
        total_tutors = await database.tutors.count_documents({})
        total_students = await database.students.count_documents({})
        total_parents = await database.parents.count_documents({})
        
        # Active users (logged in last 30 days)
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        active_tutors = await database.tutors.count_documents({"last_login": {"$gte": thirty_days_ago}})
        active_students = await database.students.count_documents({"last_login": {"$gte": thirty_days_ago}})
        active_parents = await database.parents.count_documents({"last_login": {"$gte": thirty_days_ago}})
        
        # Content metrics
        total_questions = await database.questions.count_documents({})
        total_assignments = await database.assignments.count_documents({})
        total_subjects = await database.subjects.count_documents({})
        total_materials = await database.materials.count_documents({})
        
        # Activity metrics (today)
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        questions_generated_today = await database.questions.count_documents({"created_at": {"$gte": today_start}})
        assignments_created_today = await database.assignments.count_documents({"created_at": {"$gte": today_start}})
        
        # Database stats (approximate)
        try:
            db_stats = await database.command("dbStats")
            database_size_mb = db_stats.get("dataSize", 0) / (1024 * 1024)
            storage_used_mb = db_stats.get("storageSize", 0) / (1024 * 1024)
        except Exception:
            database_size_mb = 0.0
            storage_used_mb = 0.0
        
        return SystemMetrics(
            total_tutors=total_tutors,
            total_students=total_students,
            total_parents=total_parents,
            total_users=total_tutors + total_students + total_parents,
            active_tutors=active_tutors,
            active_students=active_students,
            active_parents=active_parents,
            total_questions=total_questions,
            total_assignments=total_assignments,
            total_subjects=total_subjects,
            total_materials=total_materials,
            database_size_mb=round(database_size_mb, 2),
            storage_used_mb=round(storage_used_mb, 2),
            questions_generated_today=questions_generated_today,
            assignments_created_today=assignments_created_today,
            logins_today=0,  # Would need login tracking
            metrics_updated_at=datetime.now(timezone.utc)
        )
    except Exception as e:
        logger.error("Failed to get system metrics", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get system metrics: {str(e)}")


@router.get("/audit-logs", response_model=AuditLogListResponse)
async def get_audit_logs(
    page: int = 1,
    per_page: int = 50,
    current_user: ClerkUserContext = Depends(require_admin_permission(AdminPermission.VIEW_AUDIT_LOGS)),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get admin audit logs"""
    try:
        skip = (page - 1) * per_page
        
        # Get total count
        total = await database.admin_audit_logs.count_documents({})
        
        # Get logs with pagination
        cursor = database.admin_audit_logs.find({}).sort("timestamp", -1).skip(skip).limit(per_page)
        logs = await cursor.to_list(length=per_page)
        
        # Convert to AuditLog models
        audit_logs = []
        for log in logs:
            log["_id"] = str(log["_id"])
            audit_logs.append(AuditLog(**log))
        
        return AuditLogListResponse(
            logs=audit_logs,
            total=total,
            page=page,
            per_page=per_page
        )
    except Exception as e:
        logger.error("Failed to get audit logs", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get audit logs: {str(e)}")


@router.get("/health")
async def admin_health_check(
    current_user: ClerkUserContext = Depends(require_super_admin),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Admin health check with detailed system status"""
    try:
        # Check database connectivity
        await database.command("ping")
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "admin_user": current_user.email,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

