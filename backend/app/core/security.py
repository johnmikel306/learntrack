"""
Security module - CSRF protection, webhook verification, and security headers
"""
import hashlib
import hmac
import secrets
import time
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, status
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
import structlog

from app.core.config import settings

logger = structlog.get_logger()

# CSRF token settings
CSRF_TOKEN_NAME = "csrf_token"
CSRF_HEADER_NAME = "X-CSRF-Token"
CSRF_TOKEN_EXPIRY = 3600  # 1 hour


class CSRFProtection:
    """CSRF token generation and validation"""
    
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
    
    def generate_token(self, session_id: str) -> str:
        """Generate a CSRF token for a session"""
        timestamp = str(int(time.time()))
        random_bytes = secrets.token_hex(16)
        message = f"{session_id}:{timestamp}:{random_bytes}"
        signature = hmac.new(
            self.secret_key.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        return f"{message}:{signature}"
    
    def validate_token(self, token: str, session_id: str) -> bool:
        """Validate a CSRF token"""
        try:
            parts = token.split(":")
            if len(parts) != 4:
                return False
            
            stored_session, timestamp, random_bytes, signature = parts
            
            # Verify session matches
            if stored_session != session_id:
                return False
            
            # Verify token hasn't expired
            token_time = int(timestamp)
            if time.time() - token_time > CSRF_TOKEN_EXPIRY:
                return False
            
            # Verify signature
            message = f"{stored_session}:{timestamp}:{random_bytes}"
            expected_signature = hmac.new(
                self.secret_key.encode(),
                message.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(signature, expected_signature)
        except (ValueError, TypeError):
            return False


class WebhookVerification:
    """Webhook request signing verification"""
    
    @staticmethod
    def generate_signature(payload: bytes, secret: str, timestamp: str) -> str:
        """Generate webhook signature"""
        message = f"{timestamp}.{payload.decode()}"
        signature = hmac.new(
            secret.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        return f"v1={signature}"
    
    @staticmethod
    def verify_signature(
        payload: bytes,
        signature: str,
        secret: str,
        timestamp: str,
        tolerance: int = 300  # 5 minutes
    ) -> bool:
        """Verify webhook signature"""
        try:
            # Check timestamp is within tolerance
            ts = int(timestamp)
            if abs(time.time() - ts) > tolerance:
                logger.warning("Webhook timestamp outside tolerance", timestamp=timestamp)
                return False
            
            # Generate expected signature
            expected = WebhookVerification.generate_signature(payload, secret, timestamp)
            return hmac.compare_digest(signature, expected)
        except (ValueError, TypeError) as e:
            logger.error("Webhook signature verification failed", error=str(e))
            return False


async def verify_webhook_request(
    request: Request,
    secret: str,
    header_name: str = "X-Webhook-Signature",
    timestamp_header: str = "X-Webhook-Timestamp"
) -> bool:
    """Verify incoming webhook request"""
    signature = request.headers.get(header_name)
    timestamp = request.headers.get(timestamp_header)
    
    if not signature or not timestamp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing webhook signature or timestamp"
        )
    
    body = await request.body()
    
    if not WebhookVerification.verify_signature(body, signature, secret, timestamp):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature"
        )
    
    return True


# Initialize CSRF protection
csrf_protection = CSRFProtection(settings.SECRET_KEY)

