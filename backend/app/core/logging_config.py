"""
Structured logging configuration for production using structlog.
Supports JSON output for log aggregation (ELK, CloudWatch, etc.)
"""
import sys
import logging
from typing import Optional
import structlog
from structlog.processors import JSONRenderer, TimeStamper, add_log_level

from app.core.config import settings


def configure_logging(
    log_level: Optional[str] = None,
    json_output: Optional[bool] = None
):
    """
    Configure structured logging for the application.
    
    Args:
        log_level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_output: Whether to output JSON (defaults to True in production)
    """
    level = log_level or settings.LOG_LEVEL
    is_production = settings.ENVIRONMENT == "production"
    use_json = json_output if json_output is not None else is_production
    
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, level.upper(), logging.INFO),
    )
    
    # Shared processors
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
    ]
    
    if use_json:
        # Production: JSON output for log aggregation
        processors = shared_processors + [
            structlog.processors.format_exc_info,
            structlog.processors.dict_tracebacks,
            JSONRenderer(),
        ]
    else:
        # Development: Human-readable colored output
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True),
        ]
    
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_request_logger(request_id: str, user_id: Optional[str] = None):
    """
    Get a logger with request context bound.
    
    Args:
        request_id: Unique request identifier
        user_id: Optional user identifier
    
    Returns:
        Bound structlog logger
    """
    logger = structlog.get_logger()
    bound_logger = logger.bind(request_id=request_id)
    
    if user_id:
        bound_logger = bound_logger.bind(user_id=user_id)
    
    return bound_logger


class RequestLoggingMiddleware:
    """Middleware to add request context to logs"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            import uuid
            request_id = str(uuid.uuid4())[:8]
            
            # Add request_id to structlog context
            structlog.contextvars.clear_contextvars()
            structlog.contextvars.bind_contextvars(
                request_id=request_id,
                path=scope.get("path", ""),
                method=scope.get("method", ""),
            )
        
        await self.app(scope, receive, send)


# Initialize logging on import
configure_logging()

