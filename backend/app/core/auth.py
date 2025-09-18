from fastapi import Depends, HTTPException, Security
from fastapi.security import OAuth2PasswordBearer
from clerk_sdk.clerk import Clerk
from starlette.status import HTTP_401_UNAUTHORIZED
from app.core.config import settings

clerk = Clerk(secret_key=settings.CLERK_SECRET_KEY)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Security(oauth2_scheme)):
    try:
        decoded_token = clerk.verify_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
