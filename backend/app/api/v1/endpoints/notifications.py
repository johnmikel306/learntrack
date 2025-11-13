"""
Notification endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, Path, Query, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog

from app.core.database import get_database
from app.core.enhanced_auth import require_authenticated_user, ClerkUserContext
from app.models.notification import Notification, NotificationCreate, NotificationUpdate
from app.services.notification_service import NotificationService

logger = structlog.get_logger()
router = APIRouter()


@router.get("/", response_model=List[Notification])
async def get_notifications(
    unread_only: bool = Query(False, description="Get only unread notifications"),
    limit: int = Query(50, description="Maximum number of notifications to return"),
    current_user: ClerkUserContext = Depends(require_authenticated_user),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get notifications for current user"""
    try:
        notification_service = NotificationService(database)
        notifications = await notification_service.get_user_notifications(
            user_id=current_user.clerk_id,
            limit=limit,
            unread_only=unread_only
        )
        return notifications
    except Exception as e:
        logger.error("Failed to get notifications", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notifications"
        )


@router.get("/unread-count", response_model=dict)
async def get_unread_count(
    current_user: ClerkUserContext = Depends(require_authenticated_user),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get count of unread notifications"""
    try:
        notification_service = NotificationService(database)
        count = await notification_service.get_unread_count(current_user.clerk_id)
        return {"unread_count": count}
    except Exception as e:
        logger.error("Failed to get unread count", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve unread count"
        )


@router.put("/{notification_id}/read", response_model=Notification)
async def mark_notification_as_read(
    notification_id: str = Path(..., description="Notification ID"),
    current_user: ClerkUserContext = Depends(require_authenticated_user),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Mark a notification as read"""
    try:
        notification_service = NotificationService(database)
        notification = await notification_service.mark_as_read(
            notification_id=notification_id,
            user_id=current_user.clerk_id
        )
        
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        return notification
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to mark notification as read", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notification"
        )


@router.put("/mark-all-read", response_model=dict)
async def mark_all_notifications_as_read(
    current_user: ClerkUserContext = Depends(require_authenticated_user),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Mark all notifications as read for current user"""
    try:
        notification_service = NotificationService(database)
        count = await notification_service.mark_all_as_read(current_user.clerk_id)
        return {"marked_read": count}
    except Exception as e:
        logger.error("Failed to mark all notifications as read", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notifications"
        )


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str = Path(..., description="Notification ID"),
    current_user: ClerkUserContext = Depends(require_authenticated_user),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a notification"""
    try:
        notification_service = NotificationService(database)
        deleted = await notification_service.delete_notification(
            notification_id=notification_id,
            user_id=current_user.clerk_id
        )
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        return {"message": "Notification deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete notification", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete notification"
        )


@router.post("/", response_model=Notification)
async def create_notification(
    notification_data: NotificationCreate,
    current_user: ClerkUserContext = Depends(require_authenticated_user),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new notification (for testing/admin purposes)"""
    try:
        notification_service = NotificationService(database)
        notification = await notification_service.create_notification(notification_data)
        return notification
    except Exception as e:
        logger.error("Failed to create notification", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create notification"
        )

