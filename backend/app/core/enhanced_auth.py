"""
Enhanced Clerk Authentication for Backend-First Architecture
Handles JWT validation, user context extraction, and role-based access control
"""
import jwt
import httpx
import json
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import structlog
from functools import lru_cache
from pydantic import BaseModel, EmailStr

from app.core.config import settings
from app.models.user import UserRole
from app.core.database import get_database

logger = structlog.get_logger()


class ClerkUserContext(BaseModel):
    """Enhanced user context from Clerk JWT"""
    user_id: str
    clerk_id: str
    email: EmailStr
    name: str
    role: UserRole
    roles: List[UserRole] = []
    permissions: List[str] = ["read"]
    session_id: Optional[str] = None
    organization_id: Optional[str] = None
    created_at: Optional[datetime] = None
    last_sign_in: Optional[datetime] = None
    tutor_id: str  # Tutor ID for tenant isolation - for tutors: their own clerk_id, for others: their tutor's clerk_id
    student_ids: List[str] = []  # For parents: list of student IDs they can access

    @property
    def auth0_id(self) -> str:
        """Backward compatibility property - returns clerk_id"""
        return self.clerk_id


class EnhancedClerkJWTBearer:
    """Enhanced Clerk JWT Bearer for backend-first authentication"""
    
    def __init__(self):
        self.clerk_secret = settings.CLERK_SECRET_KEY
        self.clerk_publishable_key = settings.CLERK_PUBLISHABLE_KEY
        self.issuer = settings.CLERK_JWT_ISSUER or self._construct_issuer()
        self._jwks_cache: Optional[Dict] = None
        self._cache_expiry: Optional[datetime] = None
        
    def _construct_issuer(self) -> str:
        """Construct issuer URL from Clerk publishable key"""
        if self.clerk_publishable_key and "pk_test_" in self.clerk_publishable_key:
            # Extract domain from test key format
            return "https://healthy-antelope-32.clerk.accounts.dev"
        return "https://clerk.accounts.com"
    
    @lru_cache(maxsize=1)
    async def get_jwks(self) -> Dict:
        """Get JSON Web Key Set from Clerk with caching"""
        current_time = datetime.now(timezone.utc)
        
        # Check cache validity (refresh every hour)
        if (self._jwks_cache and self._cache_expiry and 
            current_time < self._cache_expiry):
            return self._jwks_cache
            
        try:
            # Construct JWKS URL based on Clerk instance
            jwks_url = f"{self.issuer}/.well-known/jwks.json"
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(jwks_url)
                response.raise_for_status()
                
                jwks_data = response.json()
                
                # Cache the JWKS data
                self._jwks_cache = jwks_data
                self._cache_expiry = current_time.replace(hour=current_time.hour + 1)
                
                logger.info("JWKS fetched successfully", url=jwks_url)
                return jwks_data
                
        except Exception as e:
            logger.error("Failed to fetch JWKS", error=str(e))
            # Fallback to direct secret validation if JWKS fails
            return {}
    
    async def verify_token(self, token: str) -> ClerkUserContext:
        """Verify Clerk JWT token and extract user context"""
        try:
            # Development mode fallback
            if token == "dev_token" and settings.ENVIRONMENT == "development":
                return self._create_dev_user_context()
            
            # Try JWKS verification first
            try:
                jwks = await self.get_jwks()
                if jwks and "keys" in jwks:
                    # Decode header to get key ID
                    unverified_header = jwt.get_unverified_header(token)
                    kid = unverified_header.get("kid")
                    
                    # Find matching key
                    key = None
                    for jwk in jwks["keys"]:
                        if jwk.get("kid") == kid:
                            key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwk))
                            break
                    
                    if key:
                        payload = jwt.decode(
                            token,
                            key,
                            algorithms=["RS256"],
                            issuer=self.issuer,
                            options={"verify_exp": True, "verify_aud": False}
                        )
                        return await self._extract_user_context(payload)
            
            except Exception as jwks_error:
                logger.warning("JWKS verification failed, trying secret", error=str(jwks_error))
            
            # Fallback to secret-based verification
            if self.clerk_secret:
                payload = jwt.decode(
                    token,
                    self.clerk_secret,
                    algorithms=["HS256"],
                    options={"verify_exp": True, "verify_aud": False}
                )
                return await self._extract_user_context(payload)
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError as e:
            logger.error("Invalid JWT token", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )
        except Exception as e:
            logger.error("Token verification failed", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication service error"
            )
    
    async def _extract_user_context(self, payload: Dict[str, Any]) -> ClerkUserContext:
        """Extract user context from JWT payload"""
        try:
            # Extract basic user information
            user_id = payload.get("sub")
            email = payload.get("email")
            name = payload.get("name", payload.get("given_name", "Unknown"))
            
            # Extract role from metadata
            metadata = payload.get("public_metadata", {})
            role_str = metadata.get("role", "student")
            
            # Convert role string to UserRole enum
            try:
                role = UserRole(role_str.lower())
            except ValueError:
                role = UserRole.STUDENT
                logger.warning("Invalid role in token, defaulting to student", role=role_str)
            
            # Extract additional roles if present
            roles = metadata.get("roles", [role_str])
            role_enums = []
            for r in roles:
                try:
                    role_enums.append(UserRole(r.lower()))
                except ValueError:
                    continue
            
            # Set permissions based on role
            permissions = self._get_role_permissions(role)
            
            # Set tutor_id based on role
            if role == UserRole.TUTOR:
                tutor_id = user_id  # Tutors use their own clerk_id as tutor_id
            else:
                # For students and parents, we'll need to look up their tutor_id from the database
                # For now, use a placeholder - this will be set by _sync_user_to_database
                tutor_id = "placeholder"

            # Create user context
            user_context = ClerkUserContext(
                user_id=user_id,
                clerk_id=user_id,
                email=email,
                name=name,
                role=role,
                roles=role_enums,
                permissions=permissions,
                session_id=payload.get("sid"),
                organization_id=payload.get("org_id"),
                created_at=datetime.fromtimestamp(payload.get("iat", 0), tz=timezone.utc),
                last_sign_in=datetime.now(timezone.utc),
                tutor_id=tutor_id,
                student_ids=[]  # Will be populated by _sync_user_to_database for parents
            )
            
            # Sync user with database
            await self._sync_user_to_database(user_context)
            
            return user_context
            
        except Exception as e:
            logger.error("Failed to extract user context", error=str(e), payload=payload)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
    
    def _get_role_permissions(self, role: UserRole) -> List[str]:
        """Get permissions based on user role"""
        permission_map = {
            UserRole.TUTOR: ["read", "write", "create", "delete", "manage_students"],
            UserRole.STUDENT: ["read", "write_own", "submit"],
            UserRole.PARENT: ["read", "view_children"]
        }
        return permission_map.get(role, ["read"])
    
    async def _sync_user_to_database(self, user_context: ClerkUserContext):
        """Sync user information to database"""
        try:
            # Import here to avoid circular import
            from app.services.user_service import UserService

            db = await get_database()
            user_service = UserService(db)

            # Check if user exists
            existing_user = await user_service.get_user_by_clerk_id(user_context.clerk_id)

            if not existing_user:
                # Create new user
                await user_service.create_user_from_clerk(user_context)
                logger.info("Created new user from Clerk", user_id=user_context.user_id)
            else:
                # Update existing user
                await user_service.update_user_from_clerk(user_context)
                logger.debug("Updated existing user from Clerk", user_id=user_context.user_id)

        except Exception as e:
            logger.error("Failed to sync user to database", error=str(e))
            # Don't fail authentication if database sync fails
    
    def _create_dev_user_context(self) -> ClerkUserContext:
        """Create development user context for testing"""
        return ClerkUserContext(
            user_id="dev_user_123",
            clerk_id="dev_user_123",
            email="dev@test.com",
            name="Development User",
            role=UserRole.TUTOR,
            roles=[UserRole.TUTOR],
            permissions=["read", "write", "create", "delete", "manage_students"],
            session_id="dev_session",
            created_at=datetime.now(timezone.utc),
            last_sign_in=datetime.now(timezone.utc),
            tutor_id="dev_user_123",  # Dev user is a tutor, so uses own clerk_id
            student_ids=[]
        )


# Global instance
enhanced_clerk_bearer = EnhancedClerkJWTBearer()
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> ClerkUserContext:
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    return await enhanced_clerk_bearer.verify_token(token)


async def require_authenticated_user(
    current_user: ClerkUserContext = Depends(get_current_user)
) -> ClerkUserContext:
    """Require authenticated user"""
    return current_user


async def require_tutor(
    current_user: ClerkUserContext = Depends(get_current_user)
) -> ClerkUserContext:
    """Require tutor role"""
    if current_user.role != UserRole.TUTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tutor access required"
        )
    return current_user


async def require_student(
    current_user: ClerkUserContext = Depends(get_current_user)
) -> ClerkUserContext:
    """Require student role"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required"
        )
    return current_user


async def require_parent(
    current_user: ClerkUserContext = Depends(get_current_user)
) -> ClerkUserContext:
    """Require parent role"""
    if current_user.role != UserRole.PARENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Parent access required"
        )
    return current_user


async def require_role(allowed_roles: List[UserRole]):
    """Factory function to require specific roles"""
    async def role_checker(
        current_user: ClerkUserContext = Depends(get_current_user)
    ) -> ClerkUserContext:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker
