"""
Question management endpoints
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Path, Query, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog

from app.core.database import get_database
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
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new question"""
    try:
        question_service = QuestionService(database)
        # For development, use a default tutor_id
        question = await question_service.create_question(question_data, "default_tutor")
        return question
    except Exception as e:
        logger.error("Failed to create question", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create question")

@router.get("/", response_model=List[Question])
async def get_questions(
    subject_id: Optional[str] = Query(None, description="Filter by subject ID"),
    topic: Optional[str] = Query(None, description="Filter by topic"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all questions with optional filters"""
    try:
        question_service = QuestionService(database)

        if subject_id:
            # Use the existing method for subject-specific queries
            questions = await question_service.get_questions_by_subject(
                subject_id=subject_id,
                topic=topic,
                difficulty=difficulty
            )
        else:
            # For development, get all questions directly from database
            cursor = database.questions.find({})
            questions_data = await cursor.to_list(length=None)

            # Convert to Question models with proper field mapping
            questions = []
            for question_data in questions_data:
                # Convert ObjectId to string for the id field
                question_data["id"] = str(question_data.pop("_id"))

                # Ensure all required fields are present
                if "tenant_id" not in question_data:
                    question_data["tenant_id"] = "default_tenant"
                if "tutor_id" not in question_data:
                    question_data["tutor_id"] = "default_tutor"
                if "options" not in question_data:
                    question_data["options"] = []
                if "status" not in question_data:
                    question_data["status"] = "active"
                if "ai_generated" not in question_data:
                    question_data["ai_generated"] = False

                questions.append(Question(**question_data))

        return questions
    except Exception as e:
        logger.error("Failed to get questions", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get questions")

@router.get("/{question_id}", response_model=Question)
async def get_question(
    question_id: str = Path(..., description="Question ID"),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get question by ID"""
    try:
        question_service = QuestionService(database)
        question = await question_service.get_question_by_id(question_id)
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
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update question"""
    try:
        question_service = QuestionService(database)
        question = await question_service.update_question(question_id, question_update, "default_tutor")
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
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete question"""
    try:
        question_service = QuestionService(database)
        success = await question_service.delete_question(question_id, "default_tutor")
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
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Generate questions using AI"""
    try:
        ai_manager = AIManager()
        
        # Get text content from file if file_id provided
        text_content = None
        if request.file_id:
            # Get file content from database
            file_doc = await database.files.find_one({"_id": request.file_id})
            if file_doc and file_doc.get("processed_content"):
                text_content = file_doc["processed_content"]
        
        if not text_content:
            raise HTTPException(status_code=400, detail="No text content provided")

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
