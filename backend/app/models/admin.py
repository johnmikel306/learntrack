"""
Admin models for super admin functionality
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from bson import ObjectId

from app.models.user import PyObjectId, AdminPermission


class TenantStatus(str, Enum):
    """Tenant status options"""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    PENDING = "pending"
    TRIAL = "trial"
    EXPIRED = "expired"


class TenantInfo(BaseModel):
    """Tenant (tutor) information for admin view"""
    id: PyObjectId = Field(alias="_id")
    clerk_id: str
    email: EmailStr
    name: str
    status: TenantStatus = TenantStatus.ACTIVE
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    
    # Statistics
    students_count: int = 0
    parents_count: int = 0
    subjects_count: int = 0
    questions_count: int = 0
    assignments_count: int = 0
    
    # Settings
    subscription_tier: str = "free"
    storage_used_mb: float = 0.0
    storage_limit_mb: float = 500.0
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


class TenantListResponse(BaseModel):
    """Response for tenant list endpoint"""
    tenants: List[TenantInfo]
    total: int
    page: int
    per_page: int
    total_pages: int


class TenantSuspendRequest(BaseModel):
    """Request to suspend a tenant"""
    reason: str
    notify_users: bool = True


class TenantActivateRequest(BaseModel):
    """Request to activate a tenant"""
    reason: Optional[str] = None
    notify_users: bool = True


class SystemMetrics(BaseModel):
    """System-wide metrics for admin dashboard"""
    # User counts
    total_tutors: int = 0
    total_students: int = 0
    total_parents: int = 0
    total_users: int = 0
    
    # Active users (logged in last 30 days)
    active_tutors: int = 0
    active_students: int = 0
    active_parents: int = 0
    
    # Content metrics
    total_questions: int = 0
    total_assignments: int = 0
    total_subjects: int = 0
    total_materials: int = 0
    
    # System health
    database_size_mb: float = 0.0
    storage_used_mb: float = 0.0
    
    # Activity metrics
    questions_generated_today: int = 0
    assignments_created_today: int = 0
    logins_today: int = 0
    
    # Time period
    metrics_updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AuditAction(str, Enum):
    """Types of admin actions to audit"""
    # Tenant actions
    TENANT_VIEWED = "tenant_viewed"
    TENANT_SUSPENDED = "tenant_suspended"
    TENANT_ACTIVATED = "tenant_activated"
    TENANT_DELETED = "tenant_deleted"
    
    # User actions
    USER_VIEWED = "user_viewed"
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"
    USER_ROLE_CHANGED = "user_role_changed"
    
    # System actions
    SETTINGS_CHANGED = "settings_changed"
    FEATURE_FLAG_TOGGLED = "feature_flag_toggled"
    DATA_EXPORTED = "data_exported"
    
    # Security actions
    ADMIN_LOGIN = "admin_login"
    ADMIN_PERMISSION_CHANGED = "admin_permission_changed"


class AuditLog(BaseModel):
    """Audit log entry for admin actions"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    admin_id: str  # Clerk ID of admin who performed action
    admin_email: str
    action: AuditAction
    target_type: str  # "tenant", "user", "settings", etc.
    target_id: Optional[str] = None
    details: Dict[str, Any] = {}
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


class AuditLogListResponse(BaseModel):
    """Response for audit log list endpoint"""
    logs: List[AuditLog]
    total: int
    page: int
    per_page: int

