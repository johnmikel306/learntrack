"""
Admin Service for system-wide operations
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog

from app.models.admin import SystemMetrics, AuditLog, AuditAction
from app.models.user import AdminPermission

logger = structlog.get_logger()


class AdminService:
    """Service for admin operations across the system"""
    
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
    
    async def get_system_metrics(self) -> SystemMetrics:
        """Get comprehensive system metrics"""
        try:
            # User counts
            total_tutors = await self.db.tutors.count_documents({})
            total_students = await self.db.students.count_documents({})
            total_parents = await self.db.parents.count_documents({})
            
            # Active users (logged in last 30 days)
            thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
            active_tutors = await self.db.tutors.count_documents({"last_login": {"$gte": thirty_days_ago}})
            active_students = await self.db.students.count_documents({"last_login": {"$gte": thirty_days_ago}})
            active_parents = await self.db.parents.count_documents({"last_login": {"$gte": thirty_days_ago}})
            
            # Content metrics
            total_questions = await self.db.questions.count_documents({})
            total_assignments = await self.db.assignments.count_documents({})
            total_subjects = await self.db.subjects.count_documents({})
            total_materials = await self.db.materials.count_documents({})
            
            # Today's activity
            today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
            questions_generated_today = await self.db.questions.count_documents({"created_at": {"$gte": today_start}})
            assignments_created_today = await self.db.assignments.count_documents({"created_at": {"$gte": today_start}})
            
            # Database stats
            try:
                db_stats = await self.db.command("dbStats")
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
                logins_today=0,
                metrics_updated_at=datetime.now(timezone.utc)
            )
        except Exception as e:
            logger.error("Failed to get system metrics", error=str(e))
            raise
    
    async def log_admin_action(
        self,
        admin_id: str,
        admin_email: str,
        action: AuditAction,
        target_type: str,
        target_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> str:
        """Log an admin action for audit trail"""
        try:
            log_entry = {
                "admin_id": admin_id,
                "admin_email": admin_email,
                "action": action.value,
                "target_type": target_type,
                "target_id": target_id,
                "details": details or {},
                "ip_address": ip_address,
                "user_agent": user_agent,
                "timestamp": datetime.now(timezone.utc)
            }
            
            result = await self.db.admin_audit_logs.insert_one(log_entry)
            logger.info("Admin action logged", action=action.value, admin=admin_email, target=target_id)
            return str(result.inserted_id)
        except Exception as e:
            logger.error("Failed to log admin action", error=str(e))
            raise
    
    async def get_audit_logs(
        self,
        page: int = 1,
        per_page: int = 50,
        action_filter: Optional[AuditAction] = None,
        admin_id_filter: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get paginated audit logs with optional filters"""
        try:
            query = {}
            
            if action_filter:
                query["action"] = action_filter.value
            if admin_id_filter:
                query["admin_id"] = admin_id_filter
            if start_date:
                query["timestamp"] = {"$gte": start_date}
            if end_date:
                if "timestamp" in query:
                    query["timestamp"]["$lte"] = end_date
                else:
                    query["timestamp"] = {"$lte": end_date}
            
            skip = (page - 1) * per_page
            total = await self.db.admin_audit_logs.count_documents(query)
            
            cursor = self.db.admin_audit_logs.find(query).sort("timestamp", -1).skip(skip).limit(per_page)
            logs = await cursor.to_list(length=per_page)
            
            # Convert ObjectId to string
            for log in logs:
                log["_id"] = str(log["_id"])
            
            return {
                "logs": logs,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page
            }
        except Exception as e:
            logger.error("Failed to get audit logs", error=str(e))
            raise
    
    async def check_system_health(self) -> Dict[str, Any]:
        """Check overall system health"""
        health = {"status": "healthy", "checks": {}}
        
        # Database check
        try:
            await self.db.command("ping")
            health["checks"]["database"] = {"status": "healthy"}
        except Exception as e:
            health["checks"]["database"] = {"status": "unhealthy", "error": str(e)}
            health["status"] = "degraded"
        
        # Collections check
        try:
            collections = await self.db.list_collection_names()
            health["checks"]["collections"] = {"status": "healthy", "count": len(collections)}
        except Exception as e:
            health["checks"]["collections"] = {"status": "unhealthy", "error": str(e)}
        
        health["timestamp"] = datetime.now(timezone.utc).isoformat()
        return health

