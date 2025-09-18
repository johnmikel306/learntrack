from fastapi import APIRouter, Depends, HTTPException
# from app.services.user_service import UserService  # Commented out for React migration
# from app.models.user import User, UserRole  # Commented out for React migration
from app.core.auth import get_current_user
# from clerk_sdk import Clerk  # Commented out for React migration
from app.core.config import settings

router = APIRouter()
# clerk = Clerk(secret_key=settings.CLERK_SECRET_KEY)  # Commented out for React migration

@router.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile - MOCK for React migration"""
    return {
        "id": "mock_user_123",
        "email": "demo@example.com",
        "first_name": "Demo",
        "last_name": "User",
        "role": "tutor"
    }

@router.put("/{user_id}/role")
async def update_user_role(user_id: str, current_user: dict = Depends(get_current_user)):
    """Update current user's role - MOCK for React migration"""
    return {
        "id": "mock_user_123",
        "email": "demo@example.com",
        "first_name": "Demo",
        "last_name": "User",
        "role": "tutor"
    }
