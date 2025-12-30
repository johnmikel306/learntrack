"""
Task Definitions and Configuration for Celery Migration

This module defines all background tasks that should be migrated to
a distributed task queue (Celery + Redis).
"""
from enum import Enum
from dataclasses import dataclass
from typing import Dict, List, Optional, Any


class TaskPriority(str, Enum):
    """Task priority levels for queue routing"""
    HIGH = "high"      # Critical operations (webhooks, auth)
    DEFAULT = "default"  # Standard operations
    LOW = "low"        # Non-urgent batch operations


@dataclass
class TaskConfig:
    """Configuration for a background task"""
    name: str
    description: str
    priority: TaskPriority
    max_retries: int = 3
    retry_backoff: int = 60  # seconds
    timeout: int = 300  # 5 minutes default
    rate_limit: Optional[str] = None  # e.g., "10/m"
    current_location: str = ""  # Where task is currently implemented
    estimated_duration: str = ""  # Typical duration


# All tasks identified for distributed queue migration
TASK_DEFINITIONS: Dict[str, TaskConfig] = {
    # Document Processing Tasks
    "process_document": TaskConfig(
        name="process_document",
        description="Process uploaded document using Docling/Unstructured",
        priority=TaskPriority.DEFAULT,
        max_retries=3,
        timeout=600,  # 10 minutes for large documents
        current_location="app.api.v1.endpoints.rag.process_document_for_rag",
        estimated_duration="5-60 seconds"
    ),
    
    "create_embeddings": TaskConfig(
        name="create_embeddings",
        description="Create vector embeddings for document chunks",
        priority=TaskPriority.DEFAULT,
        max_retries=3,
        timeout=300,
        rate_limit="20/m",
        current_location="app.services.rag_service.RAGService.process_document",
        estimated_duration="10-30 seconds"
    ),
    
    # AI Generation Tasks
    "generate_questions": TaskConfig(
        name="generate_questions",
        description="Generate questions using AI providers",
        priority=TaskPriority.DEFAULT,
        max_retries=2,
        timeout=120,
        rate_limit="10/m",
        current_location="app.api.v1.endpoints.question_generator",
        estimated_duration="2-10 seconds"
    ),
    
    "validate_questions": TaskConfig(
        name="validate_questions",
        description="Validate generated questions for quality",
        priority=TaskPriority.LOW,
        max_retries=2,
        timeout=60,
        current_location="app.services.ai.ai_manager",
        estimated_duration="1-5 seconds"
    ),
    
    # Email Tasks
    "send_invitation_email": TaskConfig(
        name="send_invitation_email",
        description="Send invitation email to new users",
        priority=TaskPriority.HIGH,
        max_retries=3,
        retry_backoff=120,
        timeout=30,
        current_location="app.services.email_service.EmailService.send_invitation_email",
        estimated_duration="1-3 seconds"
    ),
    
    "send_welcome_email": TaskConfig(
        name="send_welcome_email",
        description="Send welcome email after registration",
        priority=TaskPriority.DEFAULT,
        max_retries=3,
        timeout=30,
        current_location="app.services.email_service.EmailService.send_welcome_email",
        estimated_duration="1-3 seconds"
    ),
    
    "send_assignment_notification": TaskConfig(
        name="send_assignment_notification",
        description="Notify students of new assignments",
        priority=TaskPriority.DEFAULT,
        max_retries=3,
        timeout=30,
        current_location="app.services.email_service.EmailService.send_assignment_notification",
        estimated_duration="1-3 seconds"
    ),
    
    # Batch Operations
    "batch_delete_documents": TaskConfig(
        name="batch_delete_documents",
        description="Delete multiple documents and their embeddings",
        priority=TaskPriority.LOW,
        max_retries=2,
        timeout=300,
        current_location="app.api.v1.endpoints.documents.batch_delete_documents",
        estimated_duration="5-30 seconds"
    ),
    
    "batch_resync_documents": TaskConfig(
        name="batch_resync_documents",
        description="Re-process and re-embed multiple documents",
        priority=TaskPriority.LOW,
        max_retries=2,
        timeout=600,
        current_location="app.api.v1.endpoints.documents.batch_resync_documents",
        estimated_duration="30-120 seconds"
    ),
    
    # Report Generation
    "generate_progress_report": TaskConfig(
        name="generate_progress_report",
        description="Generate student progress reports",
        priority=TaskPriority.LOW,
        max_retries=2,
        timeout=120,
        current_location="TBD",
        estimated_duration="5-15 seconds"
    ),
}


def get_task_queues() -> Dict[str, List[str]]:
    """Get Celery queue routing configuration"""
    return {
        "high": [t.name for t in TASK_DEFINITIONS.values() if t.priority == TaskPriority.HIGH],
        "default": [t.name for t in TASK_DEFINITIONS.values() if t.priority == TaskPriority.DEFAULT],
        "low": [t.name for t in TASK_DEFINITIONS.values() if t.priority == TaskPriority.LOW],
    }

