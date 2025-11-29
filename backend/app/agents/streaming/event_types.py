"""
SSE Event Types for Question Generation Streaming

Defines the event types that are streamed to the frontend
during question generation for transparency and real-time updates.
"""

from typing import Optional, Dict, Any, List
from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime


class StreamEventType(str, Enum):
    """Types of events that can be streamed to the client"""
    
    # Agent thinking/reasoning
    THINKING = "agent:thinking"
    ACTION = "agent:action"
    OBSERVATION = "agent:observation"
    
    # Generation progress
    GENERATION_START = "generation:start"
    GENERATION_CHUNK = "generation:chunk"
    QUESTION_COMPLETE = "generation:question_complete"
    GENERATION_COMPLETE = "generation:complete"
    
    # Source materials
    SOURCE_RETRIEVING = "source:retrieving"
    SOURCE_FOUND = "source:found"
    SOURCE_CITED = "source:cited"
    
    # Validation
    VALIDATION_START = "validation:start"
    VALIDATION_RESULT = "validation:result"
    
    # Session
    SESSION_CREATED = "session:created"
    SESSION_RESUMED = "session:resumed"
    SESSION_PAUSED = "session:paused"
    
    # Errors
    ERROR = "error:message"
    RETRY = "error:retry"
    
    # Completion
    DONE = "done"


class StreamEventData(BaseModel):
    """Data payload for a stream event"""
    
    event_type: StreamEventType
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Thinking events
    step: Optional[str] = None
    
    # Generation events
    question_id: Optional[str] = None
    content: Optional[str] = None
    question_number: Optional[int] = None
    total_questions: Optional[int] = None
    
    # Source events
    source_id: Optional[str] = None
    source_title: Optional[str] = None
    source_excerpt: Optional[str] = None
    sources_count: Optional[int] = None
    
    # Validation events
    quality_score: Optional[float] = None
    is_valid: Optional[bool] = None
    issues: Optional[List[Dict[str, Any]]] = None
    
    # Session events
    session_id: Optional[str] = None
    
    # Error events
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    retry_count: Optional[int] = None
    
    # Complete question data (for question_complete event)
    question_data: Optional[Dict[str, Any]] = None
    
    # Additional metadata
    metadata: Optional[Dict[str, Any]] = None

    def to_sse_format(self) -> str:
        """Convert to SSE format string"""
        import json
        data = self.model_dump(exclude_none=True)
        # Convert datetime to ISO string
        if 'timestamp' in data:
            data['timestamp'] = data['timestamp'].isoformat()
        if 'event_type' in data:
            data['event_type'] = data['event_type'].value
        return f"event: {self.event_type.value}\ndata: {json.dumps(data)}\n\n"


class StreamEvent:
    """Factory for creating stream events with minimal thinking display"""
    
    @staticmethod
    def thinking(step: str) -> StreamEventData:
        """Create a thinking step event (minimal display)"""
        return StreamEventData(event_type=StreamEventType.THINKING, step=step)
    
    @staticmethod
    def action(step: str) -> StreamEventData:
        """Create an action event"""
        return StreamEventData(event_type=StreamEventType.ACTION, step=step)
    
    @staticmethod
    def observation(step: str) -> StreamEventData:
        """Create an observation event"""
        return StreamEventData(event_type=StreamEventType.OBSERVATION, step=step)
    
    @staticmethod
    def generation_start(total_questions: int, session_id: str) -> StreamEventData:
        """Signal generation is starting"""
        return StreamEventData(
            event_type=StreamEventType.GENERATION_START,
            total_questions=total_questions,
            session_id=session_id
        )
    
    @staticmethod
    def chunk(question_id: str, content: str, question_number: int) -> StreamEventData:
        """Stream a chunk of question content"""
        return StreamEventData(
            event_type=StreamEventType.GENERATION_CHUNK,
            question_id=question_id,
            content=content,
            question_number=question_number
        )
    
    @staticmethod
    def question_complete(question_id: str, question_data: Dict, quality_score: float) -> StreamEventData:
        """Signal a question is complete"""
        return StreamEventData(
            event_type=StreamEventType.QUESTION_COMPLETE,
            question_id=question_id,
            question_data=question_data,
            quality_score=quality_score
        )
    
    @staticmethod
    def source_found(source_id: str, title: str, excerpt: str) -> StreamEventData:
        """Signal a relevant source was found"""
        return StreamEventData(
            event_type=StreamEventType.SOURCE_FOUND,
            source_id=source_id,
            source_title=title,
            source_excerpt=excerpt[:200] + "..." if len(excerpt) > 200 else excerpt
        )
    
    @staticmethod
    def error(message: str, code: str = "GENERATION_ERROR") -> StreamEventData:
        """Create an error event"""
        return StreamEventData(
            event_type=StreamEventType.ERROR,
            error_message=message,
            error_code=code
        )
    
    @staticmethod
    def done(session_id: str, questions_count: int) -> StreamEventData:
        """Signal generation is complete"""
        return StreamEventData(
            event_type=StreamEventType.DONE,
            session_id=session_id,
            total_questions=questions_count
        )

