from fastapi import APIRouter, Depends, HTTPException
from app.services.user_service import UserService
from app.models.user import User, UserRole
from app.core.auth import get_current_user
from clerk_sdk import Clerk
from app.core.config import settings

router = APIRouter()
clerk = Clerk(secret_key=settings.CLERK_SECRET_KEY)

@router.get("/me", response_model=User)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    user = await UserService.get_user_by_clerk_id(current_user["sub"])
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}/role")
async def update_user_role(user_id: str, role: UserRole, current_user: dict = Depends(get_current_user)):
    # Add logic here to check if the current_user is authorized to change roles (e.g., is an admin or tutor)
    
    # Update role in Clerk public metadata
    await clerk.users.update_user_metadata(user_id, public_metadata={"role": role.value})

    # Update role in your database
    user = await UserService.get_user_by_clerk_id(user_id)
    if user:
        # You might need to add a method to UserService to update the role
        pass

    return {"status": "ok"}
