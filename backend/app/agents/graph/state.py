"""
LangGraph State Schema for Question Generator Agent

Defines the state that flows through the agent graph, including
configuration, materials, questions, and thinking steps.
"""

from typing import TypedDict, List, Optional, Dict, Any, Literal
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class QuestionType(str, Enum):
    MCQ = "MCQ"
    TRUE_FALSE = "TRUE_FALSE"
    SHORT_ANSWER = "SHORT_ANSWER"
    ESSAY = "ESSAY"


class Difficulty(str, Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"
    MIXED = "MIXED"


class BloomsLevel(str, Enum):
    REMEMBER = "REMEMBER"
    UNDERSTAND = "UNDERSTAND"
    APPLY = "APPLY"
    ANALYZE = "ANALYZE"
    EVALUATE = "EVALUATE"
    CREATE = "CREATE"


class ThinkingStep(BaseModel):
    """A single thinking step for transparency display"""
    step_type: Literal["thinking", "action", "observation"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = None


class SourceChunk(BaseModel):
    """A chunk of source material retrieved via RAG"""
    material_id: str
    material_title: str
    content: str
    location: Optional[str] = None  # Page number, section, etc.
    relevance_score: float = 0.0


class SourceCitation(BaseModel):
    """Citation linking a question to its source"""
    material_id: str
    material_title: str
    excerpt: str
    location: Optional[str] = None


class GeneratedQuestion(BaseModel):
    """A single generated question with all metadata"""
    question_id: str
    type: QuestionType
    difficulty: Difficulty
    blooms_level: BloomsLevel
    question_text: str
    options: Optional[List[str]] = None  # For MCQ/True-False
    correct_answer: str
    explanation: str
    source_citations: List[SourceCitation] = []
    tags: List[str] = []
    quality_score: Optional[float] = None
    is_valid: bool = True
    validation_issues: List[Dict[str, Any]] = []


class PromptAnalysis(BaseModel):
    """Result of analyzing the user's prompt"""
    subject: str
    topic: str
    question_count: int = 5
    question_types: List[QuestionType] = [QuestionType.MCQ]
    difficulty: Difficulty = Difficulty.MEDIUM
    blooms_levels: List[BloomsLevel] | Literal["AUTO"] = "AUTO"
    special_requirements: List[str] = []
    needs_clarification: bool = False
    clarification_questions: List[str] = []
    enhanced_prompt: str = ""


class GenerationConfig(BaseModel):
    """Configuration for question generation"""
    question_count: int = 5
    question_types: List[QuestionType] = [QuestionType.MCQ]
    difficulty: Difficulty = Difficulty.MEDIUM
    blooms_levels: List[BloomsLevel] | Literal["AUTO"] = "AUTO"
    subject: Optional[str] = None
    topic: Optional[str] = None
    grade_level: Optional[str] = None
    special_requirements: List[str] = []


class GenerationSession(BaseModel):
    """Persisted generation session for resume capability"""
    session_id: str
    user_id: str
    tenant_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    status: Literal["in_progress", "completed", "failed", "paused"] = "in_progress"
    config: GenerationConfig
    original_prompt: str
    enhanced_prompt: Optional[str] = None
    selected_materials: List[str] = []
    questions: List[GeneratedQuestion] = []
    thinking_steps: List[ThinkingStep] = []
    current_question_index: int = 0
    error_message: Optional[str] = None


class AgentState(TypedDict):
    """
    The state that flows through the LangGraph agent.
    
    This state is passed between nodes and accumulates information
    as the agent processes the generation request.
    """
    # Session info
    session_id: str
    user_id: str
    tenant_id: str
    
    # Configuration
    config: GenerationConfig
    
    # Prompt handling
    original_prompt: str
    enhanced_prompt: Optional[str]
    prompt_analysis: Optional[PromptAnalysis]
    
    # Materials
    selected_material_ids: List[str]
    retrieved_chunks: List[SourceChunk]
    
    # Generation state
    questions: List[GeneratedQuestion]
    current_question_index: int
    
    # Transparency
    thinking_steps: List[ThinkingStep]
    
    # Control flow
    needs_clarification: bool
    is_complete: bool
    error: Optional[str]

