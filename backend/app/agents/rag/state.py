"""
Agentic RAG State Definitions

Defines the state schema for the self-corrective RAG agent.
"""

from typing import TypedDict, List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime


class RAGAction(str, Enum):
    """Actions the RAG agent can take"""
    RETRIEVE = "retrieve"
    GRADE = "grade"
    REWRITE = "rewrite"
    GENERATE = "generate"
    CHECK_HALLUCINATION = "check_hallucination"
    COMPLETE = "complete"
    FAIL = "fail"


class RetrievedDocument(BaseModel):
    """A retrieved document chunk with metadata"""
    content: str
    source_file: str
    source_file_id: str
    page_number: Optional[int] = None
    chunk_index: int = 0
    relevance_score: float = 0.0
    is_relevant: bool = True
    metadata: Dict[str, Any] = Field(default_factory=dict)


class RAGConfig(BaseModel):
    """Configuration for RAG agent"""
    max_retrieval_attempts: int = 3
    relevance_threshold: float = 0.7
    top_k: int = 5
    enable_query_rewriting: bool = True
    enable_hallucination_check: bool = True
    enable_self_correction: bool = True
    temperature: float = 0.1
    generate_answer: bool = True
    document_ids: List[str] = Field(default_factory=list)


class QueryAnalysis(BaseModel):
    """Analysis of the user query"""
    original_query: str
    intent: str  # e.g., "factual", "conceptual", "procedural", "comparative"
    key_concepts: List[str] = Field(default_factory=list)
    expected_answer_type: str = "text"  # "text", "list", "explanation", "code"
    complexity: str = "medium"  # "simple", "medium", "complex"
    requires_context: bool = True


class GradingResult(BaseModel):
    """Result of relevance grading"""
    document_id: str
    is_relevant: bool
    relevance_score: float
    reasoning: str


class GenerationResult(BaseModel):
    """Result of answer generation"""
    answer: str
    confidence: float
    sources_used: List[str] = Field(default_factory=list)
    has_hallucination: bool = False
    hallucination_details: Optional[str] = None


class RAGState(TypedDict):
    """State for the Agentic RAG graph"""
    # Session info
    session_id: str
    user_id: str
    tenant_id: str
    config: RAGConfig
    
    # Query
    original_query: str
    current_query: str  # May be rewritten
    query_analysis: Optional[QueryAnalysis]

    # Source documents
    document_ids: List[str]
    
    # Retrieval
    retrieved_documents: List[RetrievedDocument]
    relevant_documents: List[RetrievedDocument]
    retrieval_attempts: int
    
    # Generation
    generated_answer: Optional[str]
    generation_result: Optional[GenerationResult]
    
    # Control flow
    next_action: Optional[RAGAction]
    iteration_count: int
    max_iterations: int
    
    # Status
    is_complete: bool
    error: Optional[str]
    
    # Thinking/reasoning trace
    thinking_steps: List[Dict[str, Any]]
    
    # Timestamps
    started_at: Optional[datetime]
    completed_at: Optional[datetime]


class RAGSession(BaseModel):
    """Complete RAG session result"""
    session_id: str
    user_id: str
    tenant_id: str
    status: str  # "completed", "failed", "no_relevant_docs"
    
    original_query: str
    final_query: str
    query_analysis: Optional[QueryAnalysis] = None
    
    answer: Optional[str] = None
    confidence: float = 0.0
    sources: List[RetrievedDocument] = Field(default_factory=list)
    
    retrieval_attempts: int = 0
    thinking_steps: List[Dict[str, Any]] = Field(default_factory=list)
    
    error: Optional[str] = None
    
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    @property
    def duration_seconds(self) -> Optional[float]:
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return None
