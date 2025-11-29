"""
Question Generator Graph - LangGraph Implementation

Main graph definition that orchestrates the question generation pipeline.
Uses ReAct pattern for reasoning and action.
"""

from typing import Optional, Dict, Any, AsyncGenerator
import uuid
from datetime import datetime, timezone
import structlog

from langgraph.graph import StateGraph, END

from app.agents.graph.state import (
    AgentState, GenerationConfig, GenerationSession,
    ThinkingStep, QuestionType, Difficulty
)
from app.agents.graph.nodes import (
    PromptAnalyzerNode, MaterialRetrieverNode,
    QuestionGeneratorNode, QuestionValidatorNode, QuestionEditorNode
)
from app.agents.streaming.sse_handler import SSEHandler
from app.agents.streaming.event_types import StreamEvent

logger = structlog.get_logger()


class QuestionGeneratorAgent:
    """
    LangGraph-based Question Generator Agent.
    
    Orchestrates the question generation pipeline with:
    - Prompt analysis
    - Material retrieval (RAG)
    - Question generation
    - Validation
    - Streaming output
    """
    
    def __init__(
        self,
        llm,
        rag_service=None,
    ):
        """
        Initialize the agent.
        
        Args:
            llm: LangChain LLM instance (ChatOpenAI, ChatGroq, etc.)
            rag_service: RAG service for material retrieval
        """
        self.llm = llm
        self.rag_service = rag_service
        self._graph = None
    
    def _build_graph(self, sse_handler: Optional[SSEHandler] = None) -> StateGraph:
        """Build the LangGraph state graph"""
        
        # Initialize nodes
        prompt_analyzer = PromptAnalyzerNode(self.llm, sse_handler)
        material_retriever = MaterialRetrieverNode(self.llm, self.rag_service, sse_handler)
        question_generator = QuestionGeneratorNode(self.llm, sse_handler)
        question_validator = QuestionValidatorNode(self.llm, sse_handler)
        
        # Create graph
        graph = StateGraph(AgentState)
        
        # Add nodes
        graph.add_node("analyze_prompt", prompt_analyzer)
        graph.add_node("retrieve_materials", material_retriever)
        graph.add_node("generate_questions", question_generator)
        graph.add_node("validate_questions", question_validator)
        
        # Define edges
        graph.set_entry_point("analyze_prompt")
        
        # Conditional edge: if needs clarification, end early
        graph.add_conditional_edges(
            "analyze_prompt",
            lambda state: "end" if state.get("needs_clarification") else "continue",
            {
                "end": END,
                "continue": "retrieve_materials"
            }
        )
        
        graph.add_edge("retrieve_materials", "generate_questions")
        graph.add_edge("generate_questions", "validate_questions")
        graph.add_edge("validate_questions", END)
        
        return graph.compile()
    
    async def generate(
        self,
        prompt: str,
        config: GenerationConfig,
        user_id: str,
        tenant_id: str,
        material_ids: Optional[list] = None,
        sse_handler: Optional[SSEHandler] = None,
    ) -> GenerationSession:
        """
        Generate questions based on prompt and config.
        
        Args:
            prompt: User's generation prompt
            config: Generation configuration
            user_id: User ID
            tenant_id: Tenant ID for multi-tenancy
            material_ids: Optional list of material IDs to use
            sse_handler: Optional SSE handler for streaming
            
        Returns:
            GenerationSession with results
        """
        session_id = str(uuid.uuid4())
        
        logger.info(
            "Starting generation",
            session_id=session_id,
            user_id=user_id,
            question_count=config.question_count
        )
        
        # Initialize state
        initial_state: AgentState = {
            "session_id": session_id,
            "user_id": user_id,
            "tenant_id": tenant_id,
            "config": config,
            "original_prompt": prompt,
            "enhanced_prompt": None,
            "prompt_analysis": None,
            "selected_material_ids": material_ids or [],
            "retrieved_chunks": [],
            "questions": [],
            "current_question_index": 0,
            "thinking_steps": [],
            "needs_clarification": False,
            "is_complete": False,
            "error": None,
        }
        
        # Emit start event
        if sse_handler:
            await sse_handler.send(
                StreamEvent.generation_start(config.question_count, session_id)
            )
        
        try:
            # Build and run graph
            graph = self._build_graph(sse_handler)
            final_state = await graph.ainvoke(initial_state)
            
            # Create session result
            session = GenerationSession(
                session_id=session_id,
                user_id=user_id,
                tenant_id=tenant_id,
                status="completed",
                config=config,
                original_prompt=prompt,
                enhanced_prompt=final_state.get("enhanced_prompt"),
                selected_materials=material_ids or [],
                questions=final_state.get("questions", []),
                thinking_steps=final_state.get("thinking_steps", []),
                current_question_index=len(final_state.get("questions", []))
            )
            
            # Emit done
            if sse_handler:
                await sse_handler.send_done(len(session.questions))
            
            return session
            
        except Exception as e:
            logger.error("Generation failed", session_id=session_id, error=str(e))
            if sse_handler:
                await sse_handler.send_error(str(e))
            raise

