"""
AI Question Generator Endpoints - LangGraph Agent

Provides streaming SSE endpoints for question generation using the
LangGraph ReAct agent architecture.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import structlog

from app.core.dependencies import get_rag_service, get_database
from app.core.enhanced_auth import require_tutor, ClerkUserContext
from app.agents.graph.state import GenerationConfig, QuestionType, Difficulty, GenerationSession
from app.agents.graph.question_generator_graph import QuestionGeneratorAgent
from app.agents.streaming.sse_handler import SSEHandler
from app.services.ai.ai_manager import AIManager
from app.services.generation_session_service import GenerationSessionService
from app.models.generation_session import SessionStatus, QuestionStatus, StoredQuestion

logger = structlog.get_logger()
router = APIRouter()


async def get_session_service(db = Depends(get_database)):
    """Dependency for session service"""
    return GenerationSessionService(db)


class GenerateRequest(BaseModel):
    """Request body for question generation"""
    prompt: str = Field(..., description="User's generation prompt")
    question_count: int = Field(default=5, ge=1, le=20, description="Number of questions")
    question_types: List[str] = Field(default=["MCQ"], description="Question types to generate")
    difficulty: str = Field(default="MEDIUM", description="Difficulty level")
    material_ids: Optional[List[str]] = Field(default=None, description="Material IDs to use")
    grade_level: Optional[str] = Field(default=None, description="Target grade level")
    subject: Optional[str] = Field(default=None, description="Subject area")
    topic: Optional[str] = Field(default=None, description="Specific topic")
    ai_provider: Optional[str] = Field(default=None, description="AI provider to use")


class EditQuestionRequest(BaseModel):
    """Request body for editing a question"""
    question_id: str = Field(..., description="ID of question to edit")
    edit_instruction: str = Field(..., description="What to change")
    new_source_ids: Optional[List[str]] = Field(default=None, description="New sources for regeneration")


class SessionResponse(BaseModel):
    """Response with session info"""
    session_id: str
    status: str
    questions_count: int
    message: str


@router.post("/stream", response_class=StreamingResponse)
async def generate_questions_stream(
    request: GenerateRequest,
    current_user: ClerkUserContext = Depends(require_tutor),
    rag_service = Depends(get_rag_service),
    session_service: GenerationSessionService = Depends(get_session_service)
):
    """
    Generate questions with streaming SSE output.

    Returns a Server-Sent Events stream with:
    - agent:thinking - Agent's reasoning steps
    - agent:action - Actions being taken
    - source:found - Source materials discovered
    - generation:chunk - Streamed question content
    - generation:question_complete - Individual question completion
    - done - Stream complete
    """
    try:
        # Build config
        config = GenerationConfig(
            question_count=request.question_count,
            question_types=[QuestionType(t) for t in request.question_types],
            difficulty=Difficulty(request.difficulty),
            subject=request.subject,
            topic=request.topic,
            grade_level=request.grade_level,
        )

        # Create session for persistence
        session = await session_service.create_session(
            user_id=current_user.clerk_id,
            tenant_id=current_user.tutor_id,  # tutor_id is used for tenant isolation
            prompt=request.prompt,
            config=config.model_dump() if hasattr(config, 'model_dump') else dict(config),
            material_ids=request.material_ids
        )

        # Get LLM
        ai_manager = AIManager()
        provider = ai_manager.get_provider(request.ai_provider)
        llm = provider.llm

        # Create agent
        agent = QuestionGeneratorAgent(llm=llm, rag_service=rag_service)

        # Create SSE handler with session ID
        sse_handler = SSEHandler(session.session_id)

        async def generate_with_stream():
            """Run generation and stream events"""
            try:
                # Update session status
                await session_service.update_session(
                    session.session_id,
                    current_user.clerk_id,
                    status=SessionStatus.IN_PROGRESS.value
                )

                result = await agent.generate(
                    prompt=request.prompt,
                    config=config,
                    user_id=current_user.clerk_id,
                    tenant_id=current_user.tutor_id,  # tutor_id is used for tenant isolation
                    material_ids=request.material_ids,
                    sse_handler=sse_handler
                )

                # Save questions to session
                if result and result.questions:
                    for q in result.questions:
                        stored_q = StoredQuestion(
                            question_id=q.question_id,
                            type=q.type.value,
                            difficulty=q.difficulty.value,
                            blooms_level=q.blooms_level.value,
                            question_text=q.question_text,
                            options=q.options,
                            correct_answer=q.correct_answer,
                            explanation=q.explanation,
                            source_citations=[c.model_dump() for c in q.source_citations],
                            tags=q.tags,
                            quality_score=q.quality_score
                        )
                        await session_service.add_question(
                            session.session_id,
                            current_user.clerk_id,
                            stored_q
                        )

                    await session_service.update_session(
                        session.session_id,
                        current_user.clerk_id,
                        status=SessionStatus.COMPLETED.value
                    )

            except Exception as e:
                logger.error("Generation error", error=str(e))
                await session_service.update_session(
                    session.session_id,
                    current_user.clerk_id,
                    status=SessionStatus.FAILED.value,
                    error_message=str(e)
                )
                await sse_handler.send_error(str(e))
            
            async for event in sse_handler.event_generator():
                yield event
        
        return StreamingResponse(
            generate_with_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Disable nginx buffering
            }
        )
        
    except Exception as e:
        logger.error("Failed to start generation", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate", response_model=SessionResponse)
async def generate_questions(
    request: GenerateRequest,
    current_user: ClerkUserContext = Depends(require_tutor),
    rag_service = Depends(get_rag_service)
):
    """
    Generate questions (non-streaming).
    
    Returns when generation is complete with session info.
    """
    try:
        config = GenerationConfig(
            question_count=request.question_count,
            question_types=[QuestionType(t) for t in request.question_types],
            difficulty=Difficulty(request.difficulty),
            subject=request.subject,
            topic=request.topic,
            grade_level=request.grade_level,
        )
        
        ai_manager = AIManager()
        provider = ai_manager.get_provider(request.ai_provider)
        llm = provider.llm
        
        agent = QuestionGeneratorAgent(llm=llm, rag_service=rag_service)
        
        session = await agent.generate(
            prompt=request.prompt,
            config=config,
            user_id=current_user.clerk_id,
            tenant_id=current_user.tutor_id,  # tutor_id is used for tenant isolation
            material_ids=request.material_ids,
        )
        
        return SessionResponse(
            session_id=session.session_id,
            status=session.status,
            questions_count=len(session.questions),
            message=f"Generated {len(session.questions)} questions"
        )

    except Exception as e:
        logger.error("Generation failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/edit")
async def edit_question(
    request: EditQuestionRequest,
    session_id: str = Query(..., description="Generation session ID"),
    current_user: ClerkUserContext = Depends(require_tutor),
    rag_service = Depends(get_rag_service)
):
    """
    Edit a single question from a generation session.

    Allows editing:
    - Question text
    - Options (for MCQ)
    - Regenerate with different sources
    """
    try:
        # TODO: Retrieve session from database
        # For now, we need to implement session persistence

        ai_manager = AIManager()
        provider = ai_manager.get_provider()
        llm = provider.llm

        agent = QuestionGeneratorAgent(llm=llm, rag_service=rag_service)

        # Create minimal state for editing
        from app.agents.graph.state import AgentState, GenerationConfig
        from app.agents.graph.nodes import QuestionEditorNode

        editor = QuestionEditorNode(llm=llm)

        # TODO: Load questions from session
        # For now, return placeholder
        return {
            "message": "Edit endpoint ready - session persistence required",
            "question_id": request.question_id,
            "instruction": request.edit_instruction
        }

    except Exception as e:
        logger.error("Edit failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}")
async def get_session(
    session_id: str,
    current_user: ClerkUserContext = Depends(require_tutor),
    session_service: GenerationSessionService = Depends(get_session_service)
):
    """
    Get a generation session by ID.

    Used for resuming incomplete generations or reviewing completed ones.
    """
    session = await session_service.get_session(session_id, current_user.clerk_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return session.model_dump()


@router.get("/sessions")
async def list_sessions(
    status: Optional[str] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: ClerkUserContext = Depends(require_tutor),
    session_service: GenerationSessionService = Depends(get_session_service)
):
    """
    List generation sessions for the current user.
    """
    status_enum = SessionStatus(status) if status else None

    sessions, total = await session_service.list_sessions(
        user_id=current_user.clerk_id,
        tenant_id=current_user.tutor_id,  # tutor_id is used for tenant isolation
        status=status_enum,
        page=page,
        per_page=per_page
    )

    return {
        "items": [s.model_dump() for s in sessions],
        "page": page,
        "per_page": per_page,
        "total": total
    }


@router.post("/sessions/{session_id}/questions/{question_id}/approve")
async def approve_question(
    session_id: str,
    question_id: str,
    current_user: ClerkUserContext = Depends(require_tutor),
    session_service: GenerationSessionService = Depends(get_session_service)
):
    """Approve a generated question"""
    success = await session_service.update_question_status(
        session_id=session_id,
        user_id=current_user.clerk_id,
        question_id=question_id,
        status=QuestionStatus.APPROVED
    )

    if not success:
        raise HTTPException(status_code=404, detail="Question not found")

    return {"message": "Question approved", "question_id": question_id}


@router.post("/sessions/{session_id}/questions/{question_id}/reject")
async def reject_question(
    session_id: str,
    question_id: str,
    current_user: ClerkUserContext = Depends(require_tutor),
    session_service: GenerationSessionService = Depends(get_session_service)
):
    """Reject a generated question"""
    success = await session_service.update_question_status(
        session_id=session_id,
        user_id=current_user.clerk_id,
        question_id=question_id,
        status=QuestionStatus.REJECTED
    )

    if not success:
        raise HTTPException(status_code=404, detail="Question not found")

    return {"message": "Question rejected", "question_id": question_id}


@router.get("/stats")
async def get_generation_stats(
    current_user: ClerkUserContext = Depends(require_tutor),
    session_service: GenerationSessionService = Depends(get_session_service)
):
    """
    Get generation statistics for the current user.

    Returns:
    - total_generated: Total questions generated all time
    - this_month: Questions generated this month
    - success_rate: Percentage of successful generations
    - avg_quality: Average quality score (based on approval rate)
    """
    stats = await session_service.get_stats(
        user_id=current_user.clerk_id,
        tenant_id=current_user.tutor_id  # tutor_id is used for tenant isolation
    )
    return stats
