"""
RAG (Retrieval-Augmented Generation) endpoints
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Path, Query, HTTPException, BackgroundTasks, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog

from app.core.database import get_database
from app.core.enhanced_auth import require_tutor, ClerkUserContext
from app.core.rate_limit import limiter, RATE_LIMITS
from app.models.rag import (
    RAGQuestionGenerationRequest, RAGGenerationResponse, QuestionRegenerationRequest,
    DocumentLibraryItem, DocumentProcessingStatus, TutorRAGSettings
)
from app.models.question import QuestionCreate
from app.services.rag_service import RAGService
from app.services.web_search_service import WebSearchService
from app.services.ai.ai_manager import AIManager, ai_manager
from app.services.question_service import QuestionService

logger = structlog.get_logger()
router = APIRouter()


@router.post("/generate", response_model=RAGGenerationResponse)
@limiter.limit(RATE_LIMITS["ai_generation"])
async def generate_questions_with_rag(
    request: Request,
    body: RAGQuestionGenerationRequest,
    background_tasks: BackgroundTasks,
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Generate questions using RAG with optional web search"""
    try:
        rag_service = RAGService(database)
        web_search_service = WebSearchService(database)
        question_service = QuestionService(database)

        # Get RAG context from selected documents
        rag_context = ""
        source_chunks = []
        if body.document_ids:
            query = f"{body.subject} {body.topic}"
            documents = await rag_service.retrieve_context(
                query, current_user.clerk_id, body.document_ids, top_k=body.context_chunks
            )
            for doc in documents:
                rag_context += doc.page_content + "\n\n"
                source_chunks.append({
                    "file_id": doc.metadata.get("file_id"),
                    "chunk_index": doc.metadata.get("chunk_index"),
                    "score": doc.metadata.get("score")
                })

        # Get web search context if enabled
        web_results = []
        if body.use_web_search:
            web_context = await web_search_service.search_for_context(
                body.topic, body.subject, current_user.clerk_id
            )
            if web_context:
                rag_context += f"\n\nWEB SEARCH RESULTS:\n{web_context}"
                results = await web_search_service.search(
                    f"{body.subject} {body.topic}", current_user.clerk_id, max_results=3
                )
                web_results = [r.model_dump() for r in results]

        # Generate questions with RAG context
        manager = AIManager()
        if body.model:
            manager.set_provider_model(body.provider, body.model)

        questions = await manager.generate_questions_with_rag(
            text_content=body.additional_context or "",
            rag_context=rag_context,
            subject=body.subject,
            topic=body.topic,
            question_count=body.question_count,
            difficulty=body.difficulty,
            question_types=body.question_types,
            provider_name=body.provider
        )

        # Store generated questions as pending
        stored_questions = []
        for q in questions:
            q_dict = q.model_dump()
            q_dict["tutor_id"] = current_user.clerk_id
            q_dict["status"] = "pending"
            q_dict["rag_context_used"] = bool(rag_context)
            q_dict["web_search_used"] = body.use_web_search
            q_dict["source_chunks"] = source_chunks
            q_dict["web_search_results"] = web_results
            q_dict["generation_model"] = body.model or "default"
            stored = await question_service.create_question(QuestionCreate(**q_dict), current_user.clerk_id)
            stored_questions.append(stored)

        return RAGGenerationResponse(
            questions=stored_questions,
            total_generated=len(stored_questions),
            source_documents=body.document_ids or [],
            web_search_used=body.use_web_search,
            provider_used=body.provider,
            model_used=body.model or "default"
        )

    except Exception as e:
        logger.error("RAG question generation failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.post("/regenerate-question", response_model=QuestionCreate)
@limiter.limit(RATE_LIMITS["ai_regenerate"])
async def regenerate_single_question(
    request: Request,
    body: QuestionRegenerationRequest,
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Regenerate a single question with modifications"""
    try:
        manager = AIManager()
        prompt = f"""Regenerate this question with the following modifications:
Original: {body.original_question}
Modifications: {body.modification_prompt}
Keep the same topic and difficulty level."""

        questions = await manager.generate_questions(
            text_content=prompt, subject="", topic="", question_count=1,
            provider_name=body.provider
        )

        if not questions:
            raise HTTPException(status_code=500, detail="Failed to regenerate question")

        return questions[0]
    except Exception as e:
        logger.error("Question regeneration failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models/{provider}", response_model=Dict[str, Any])
async def get_available_models(
    provider: str = Path(..., description="AI provider name"),
    current_user: ClerkUserContext = Depends(require_tutor)
):
    """Get available models for a provider"""
    try:
        manager = AIManager()
        models = manager.get_available_models(provider)
        return {"provider": provider, "models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/library", response_model=List[DocumentLibraryItem])
async def get_document_library(
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get tutor's document library with embedding status"""
    try:
        files = await database.files.find({"tutor_id": current_user.clerk_id}).to_list(100)
        library_items = []
        for f in files:
            item = DocumentLibraryItem(
                id=str(f["_id"]),
                filename=f.get("filename", ""),
                file_type=f.get("file_type", ""),
                file_size=f.get("file_size", 0),
                uploaded_at=f.get("created_at"),
                embedding_status=f.get("embedding_status", "pending"),
                chunk_count=f.get("chunk_count"),
                tags=f.get("tags", []),
                category=f.get("category")
            )
            library_items.append(item)
        return library_items
    except Exception as e:
        logger.error("Failed to get document library", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process/{file_id}", response_model=DocumentProcessingStatus)
async def process_document_for_rag(
    file_id: str = Path(..., description="File ID to process"),
    background_tasks: BackgroundTasks = None,
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Process a document for RAG (create embeddings)"""
    try:
        # Get file info
        file_doc = await database.files.find_one({"_id": file_id, "tutor_id": current_user.clerk_id})
        if not file_doc:
            raise HTTPException(status_code=404, detail="File not found")

        rag_service = RAGService(database)

        # Process in background if background_tasks available
        if background_tasks:
            background_tasks.add_task(
                rag_service.process_document,
                file_doc.get("file_path", ""),
                file_id,
                current_user.clerk_id,
                file_doc.get("file_url")
            )
            return DocumentProcessingStatus(
                file_id=file_id, status="processing", message="Document processing started"
            )
        else:
            result = await rag_service.process_document(
                file_doc.get("file_path", ""),
                file_id,
                current_user.clerk_id,
                file_doc.get("file_url")
            )
            return DocumentProcessingStatus(
                file_id=file_id, status="completed",
                chunks_processed=result.get("chunks", 0),
                message="Document processed successfully"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Document processing failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/embeddings/{file_id}")
async def delete_document_embeddings(
    file_id: str = Path(..., description="File ID"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete embeddings for a document"""
    try:
        rag_service = RAGService(database)
        await rag_service.delete_file_embeddings(file_id, current_user.clerk_id)

        # Update file status
        await database.files.update_one(
            {"_id": file_id},
            {"$set": {"embedding_status": "pending", "chunk_count": None}}
        )
        return {"message": "Embeddings deleted successfully"}
    except Exception as e:
        logger.error("Failed to delete embeddings", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=Dict[str, Any])
async def get_rag_stats(
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get RAG statistics for tutor"""
    try:
        rag_service = RAGService(database)
        web_search_service = WebSearchService(database)

        collection_stats = await rag_service.get_collection_stats(current_user.clerk_id)
        remaining_credits = await web_search_service.get_remaining_credits(current_user.clerk_id)

        # Count documents by status
        pipeline = [
            {"$match": {"tutor_id": current_user.clerk_id}},
            {"$group": {"_id": "$embedding_status", "count": {"$sum": 1}}}
        ]
        status_counts = await database.files.aggregate(pipeline).to_list(10)

        return {
            "collection_stats": collection_stats,
            "web_search_credits": remaining_credits,
            "documents_by_status": {s["_id"]: s["count"] for s in status_counts if s["_id"]}
        }
    except Exception as e:
        logger.error("Failed to get RAG stats", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/providers", response_model=List[str])
async def get_available_providers(current_user: ClerkUserContext = Depends(require_tutor)):
    """Get list of available AI providers"""
    manager = AIManager()
    return manager.get_available_providers()

