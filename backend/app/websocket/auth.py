"""
WebSocket authentication using Clerk JWT tokens
"""
import structlog
from typing import Optional, Dict

from app.core.enhanced_auth import enhanced_clerk_bearer, ClerkUserContext

logger = structlog.get_logger()


async def authenticate_socket(token: str) -> Optional[ClerkUserContext]:
    """
    Authenticate WebSocket connection using Clerk JWT token
    
    Args:
        token: JWT token from client
        
    Returns:
        ClerkUserContext if authentication successful, None otherwise
    """
    try:
        user_context = await enhanced_clerk_bearer.verify_token(token)
        logger.info("WebSocket authentication successful", user_id=user_context.clerk_id)
        return user_context
    except Exception as e:
        logger.error("WebSocket authentication failed", error=str(e))
        return None


def get_user_room(user_id: str) -> str:
    """
    Get user's personal room name
    
    Args:
        user_id: User's Clerk ID
        
    Returns:
        Room name
    """
    return f"user_{user_id}"


def get_conversation_room(conversation_id: str) -> str:
    """
    Get conversation room name
    
    Args:
        conversation_id: Conversation ID
        
    Returns:
        Room name
    """
    return f"conversation_{conversation_id}"

