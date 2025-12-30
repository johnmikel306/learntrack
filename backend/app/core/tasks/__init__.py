"""
Background Tasks Module

This module provides the infrastructure for distributed task processing using Celery.
Currently includes architecture design and task definitions ready for Celery integration.

Tasks identified for distributed processing:
1. Document Processing (docling/unstructured) - CPU intensive
2. AI Question Generation - API calls with potential latency
3. Email Sending - External service calls
4. File Embedding/RAG Processing - Vector database operations
5. Report Generation - Aggregate data processing

Architecture:
- Celery with Redis as message broker
- Redis as result backend
- Task priority queues (high, default, low)
- Retry logic with exponential backoff
"""

from app.core.tasks.definitions import (
    TaskPriority,
    TaskConfig,
    TASK_DEFINITIONS,
)

__all__ = [
    "TaskPriority",
    "TaskConfig", 
    "TASK_DEFINITIONS",
]

