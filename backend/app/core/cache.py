"""
In-memory caching infrastructure using cachetools and functools.
Provides caching decorators for expensive database queries and AI responses.
"""
import hashlib
import json
import functools
from typing import Any, Callable, Optional, TypeVar, Dict
from datetime import datetime, timedelta
from cachetools import TTLCache, LRUCache
import structlog

logger = structlog.get_logger()

# Type variable for generic function return types
T = TypeVar('T')

# Default cache configurations
DEFAULT_TTL = 300  # 5 minutes
DEFAULT_MAXSIZE = 1000

# Global cache instances
_dashboard_cache: TTLCache = TTLCache(maxsize=500, ttl=60)  # 1 minute TTL
_user_session_cache: TTLCache = TTLCache(maxsize=1000, ttl=300)  # 5 minutes TTL
_ai_response_cache: TTLCache = TTLCache(maxsize=200, ttl=1800)  # 30 minutes TTL
_query_cache: TTLCache = TTLCache(maxsize=1000, ttl=120)  # 2 minutes TTL


def _make_cache_key(*args, **kwargs) -> str:
    """Generate a cache key from function arguments"""
    key_parts = [str(arg) for arg in args]
    key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
    key_string = ":".join(key_parts)
    return hashlib.md5(key_string.encode()).hexdigest()


def cached(
    cache: Optional[TTLCache] = None,
    ttl: int = DEFAULT_TTL,
    maxsize: int = DEFAULT_MAXSIZE,
    key_prefix: str = ""
) -> Callable:
    """
    Decorator for caching function results.
    
    Args:
        cache: Optional existing cache to use
        ttl: Time-to-live in seconds
        maxsize: Maximum cache size
        key_prefix: Prefix for cache keys
    
    Usage:
        @cached(ttl=60, key_prefix="dashboard")
        async def get_dashboard_stats(tutor_id: str) -> dict:
            ...
    """
    if cache is None:
        cache = TTLCache(maxsize=maxsize, ttl=ttl)
    
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs) -> T:
            cache_key = f"{key_prefix}:{_make_cache_key(*args, **kwargs)}"
            
            # Check cache
            if cache_key in cache:
                logger.debug("Cache hit", key=cache_key, func=func.__name__)
                return cache[cache_key]
            
            # Call function and cache result
            result = await func(*args, **kwargs)
            cache[cache_key] = result
            logger.debug("Cache miss - stored", key=cache_key, func=func.__name__)
            return result
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs) -> T:
            cache_key = f"{key_prefix}:{_make_cache_key(*args, **kwargs)}"
            
            if cache_key in cache:
                logger.debug("Cache hit", key=cache_key, func=func.__name__)
                return cache[cache_key]
            
            result = func(*args, **kwargs)
            cache[cache_key] = result
            logger.debug("Cache miss - stored", key=cache_key, func=func.__name__)
            return result
        
        # Return appropriate wrapper based on function type
        if asyncio_iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


def asyncio_iscoroutinefunction(func: Callable) -> bool:
    """Check if function is async"""
    import asyncio
    return asyncio.iscoroutinefunction(func)


# Convenience decorators for specific cache types
def cache_dashboard(ttl: int = 60):
    """Cache decorator for dashboard statistics"""
    return cached(cache=_dashboard_cache, ttl=ttl, key_prefix="dashboard")


def cache_user_session(ttl: int = 300):
    """Cache decorator for user session data"""
    return cached(cache=_user_session_cache, ttl=ttl, key_prefix="session")


def cache_ai_response(ttl: int = 1800):
    """Cache decorator for AI responses"""
    return cached(cache=_ai_response_cache, ttl=ttl, key_prefix="ai")


def cache_query(ttl: int = 120):
    """Cache decorator for database queries"""
    return cached(cache=_query_cache, ttl=ttl, key_prefix="query")


# Cache invalidation functions
def invalidate_dashboard_cache(tutor_id: Optional[str] = None):
    """Invalidate dashboard cache entries"""
    if tutor_id:
        keys_to_remove = [k for k in _dashboard_cache.keys() if tutor_id in str(k)]
        for key in keys_to_remove:
            _dashboard_cache.pop(key, None)
        logger.info("Invalidated dashboard cache", tutor_id=tutor_id, count=len(keys_to_remove))
    else:
        _dashboard_cache.clear()
        logger.info("Cleared all dashboard cache")


def invalidate_user_cache(user_id: str):
    """Invalidate user session cache"""
    keys_to_remove = [k for k in _user_session_cache.keys() if user_id in str(k)]
    for key in keys_to_remove:
        _user_session_cache.pop(key, None)
    logger.info("Invalidated user cache", user_id=user_id, count=len(keys_to_remove))


def invalidate_ai_cache():
    """Clear AI response cache"""
    _ai_response_cache.clear()
    logger.info("Cleared AI response cache")


def get_cache_stats() -> Dict[str, Dict[str, int]]:
    """Get statistics for all caches"""
    return {
        "dashboard": {"size": len(_dashboard_cache), "maxsize": _dashboard_cache.maxsize},
        "user_session": {"size": len(_user_session_cache), "maxsize": _user_session_cache.maxsize},
        "ai_response": {"size": len(_ai_response_cache), "maxsize": _ai_response_cache.maxsize},
        "query": {"size": len(_query_cache), "maxsize": _query_cache.maxsize},
    }

