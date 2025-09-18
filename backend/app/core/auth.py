from fastapi import Depends, HTTPException, Security
from fastapi.security import OAuth2PasswordBearer
# from clerk_sdk.clerk import Clerk  # Commented out for React migration
from starlette.status import HTTP_401_UNAUTHORIZED
from app.core.config import settings

# clerk = Clerk(secret_key=settings.CLERK_SECRET_KEY)  # Commented out for React migration

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Security(oauth2_scheme)):
    """Mock authentication for React migration - returns a dummy user"""
    return {
        "id": "mock_user_123",
        "email": "demo@example.com",
        "first_name": "Demo",
        "last_name": "User"
    }
