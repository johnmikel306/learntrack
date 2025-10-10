"""
Question management endpoints
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Path, Query, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog

from app.core.database import get_database
from app.core.enhanced_auth import require_tutor, require_authenticated_user, ClerkUserContext
from app.models.question import (
    Question, QuestionCreate, QuestionUpdate, QuestionForStudent,
    QuestionGenerationRequest, QuestionGenerationResponse
)
from app.services.ai.ai_manager import AIManager
from app.services.question_service import QuestionService
from app.services.user_service import UserService

logger = structlog.get_logger()
router = APIRouter()

@router.post("/", response_model=Question)
async def create_question(
    question_data: QuestionCreate,
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new question"""
    try:
        question_service = QuestionService(database)
        question = await question_service.create_question(question_data, current_user.clerk_id)
        return question
    except Exception as e:
        logger.error("Failed to create question", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create question")

@router.get("/", response_model=List[Question])
async def get_questions(
    subject_id: Optional[str] = Query(None, description="Filter by subject ID"),
    topic: Optional[str] = Query(None, description="Filter by topic"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all questions with optional filters"""
    try:
        question_service = QuestionService(database)
        questions = await question_service.get_questions_for_tutor(
            tutor_id=current_user.clerk_id,
            subject_id=subject_id,
            topic=topic,
            difficulty=difficulty
        )
        return questions
    except Exception as e:
        logger.error("Failed to get questions", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get questions")

@router.get("/{question_id}", response_model=Question)
async def get_question(
    question_id: str = Path(..., description="Question ID"),
    current_user: ClerkUserContext = Depends(require_authenticated_user),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get question by ID"""
    try:
        question_service = QuestionService(database)
        question = await question_service.get_question_by_id(question_id, current_user)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        return question
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get question", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get question")

@router.get("/{question_id}/student", response_model=QuestionForStudent)
async def get_question_for_student(
    question_id: str = Path(..., description="Question ID"),
    current_user: ClerkUserContext = Depends(require_authenticated_user),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get question for student (without correct answers)"""
    try:
        question_service = QuestionService(database)
        question = await question_service.get_question_for_student(question_id)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        return question
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get question for student", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get question")

@router.put("/{question_id}", response_model=Question)
async def update_question(
    question_update: QuestionUpdate,
    question_id: str = Path(..., description="Question ID"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update question"""
    try:
        question_service = QuestionService(database)
        question = await question_service.update_question(question_id, question_update, current_user.clerk_id)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        return question
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update question", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update question")

@router.delete("/{question_id}")
async def delete_question(
    question_id: str = Path(..., description="Question ID"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete question"""
    try:
        question_service = QuestionService(database)
        success = await question_service.delete_question(question_id, current_user.clerk_id)
        if not success:
            raise HTTPException(status_code=404, detail="Question not found")
        return {"message": "Question deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete question", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to delete question")

@router.post("/generate", response_model=QuestionGenerationResponse)
async def generate_questions(
    request: QuestionGenerationRequest,
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Generate questions using AI"""
    try:
        question_service = QuestionService(database)
        ai_manager = AIManager()
        
        text_content = None
        if request.file_id:
            text_content = await question_service.get_text_content_from_file(request.file_id, current_user.clerk_id)
        
        if not text_content:
            raise HTTPException(status_code=400, detail="No text content provided or file not found")

        # Generate questions
        questions = await ai_manager.generate_questions(
            text_content=text_content,
            question_count=request.question_count,
            difficulty=request.difficulty_levels[0] if request.difficulty_levels else None,
            question_types=request.question_types,
            ai_provider=request.ai_provider,
            custom_prompt=request.custom_prompt
        )
        
        return QuestionGenerationResponse(
            questions=questions,
            total_generated=len(questions),
            ai_provider_used=request.ai_provider
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to generate questions", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to generate questions")


@router.get("/pending", response_model=List[Question])
async def get_pending_questions(
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all pending questions awaiting approval"""
    try:
        question_service = QuestionService(database)
        questions = await question_service.get_questions_for_tutor(
            tutor_id=current_user.clerk_id,
            status="pending"
        )
        return questions
    except Exception as e:
        logger.error("Failed to get pending questions", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get pending questions")


@router.put("/{question_id}/approve", response_model=Question)
async def approve_question(
    question_id: str = Path(..., description="Question ID"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Approve a pending question"""
    try:
        question_service = QuestionService(database)
        question = await question_service.approve_question(question_id, current_user.clerk_id)
        return question
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to approve question", question_id=question_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{question_id}/reject", response_model=Question)
async def reject_question(
    question_id: str = Path(..., description="Question ID"),
    reason: Optional[str] = Query(None, description="Rejection reason"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Reject a pending question"""
    try:
        question_service = QuestionService(database)
        question = await question_service.reject_question(question_id, current_user.clerk_id, reason)
        return question
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to reject question", question_id=question_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{question_id}/request-revision", response_model=Question)
async def request_revision(
    question_id: str = Path(..., description="Question ID"),
    notes: str = Query(..., description="Revision notes"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Request revision for a pending question"""
    try:
        question_service = QuestionService(database)
        question = await question_service.request_revision(question_id, notes)
        return question
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to request revision", question_id=question_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk-approve", response_model=dict)
async def bulk_approve_questions(
    question_ids: List[str],
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Approve multiple questions at once"""
    try:
        question_service = QuestionService(database)
        count = await question_service.bulk_approve_questions(question_ids, current_user.clerk_id)
        return {"approved_count": count, "total_requested": len(question_ids)}
    except Exception as e:
        logger.error("Failed to bulk approve questions", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to bulk approve questions")
