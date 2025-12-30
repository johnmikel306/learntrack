"""
File handling endpoints with tenant isolation
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Path, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog

from app.core.database import get_database
from app.core.enhanced_auth import require_tutor, require_authenticated_user, ClerkUserContext
from app.models.file import (
    FileRegistrationResponse, FileProcessingResult, UploadedFile,
    FileMetadataRequest, UploadThingWebhookPayload
)
from app.services.file_service import FileService
from app.services.question_service import QuestionService

logger = structlog.get_logger()
router = APIRouter()


@router.post("/register", response_model=FileRegistrationResponse)
async def register_file_metadata(
    request: FileMetadataRequest,
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Register file metadata after UploadThing upload (tutor only, with tenant isolation)"""
    file_service = FileService(database)

    # Register file metadata with tutor_id for tenant isolation
    uploaded_file = await file_service.register_file_metadata(
        request=request,
        uploaded_by=current_user.clerk_id,
        tutor_id=current_user.clerk_id  # Set tutor_id for tenant isolation
    )

    return FileRegistrationResponse(
        file_id=str(uploaded_file.id),
        filename=uploaded_file.filename,
        size=uploaded_file.size,
        status=uploaded_file.status,
        uploadthing_url=str(uploaded_file.uploadthing_url),
        message="File metadata registered successfully"
    )


@router.post("/webhook")
async def uploadthing_webhook(
    payload: UploadThingWebhookPayload
):
    """Handle UploadThing webhooks"""
    # This endpoint can be used for automatic file processing
    # when UploadThing sends webhooks after file uploads

    if payload.eventType == "upload.completed":
        # Handle completed upload
        # You could automatically register the file metadata here
        # or trigger processing based on the webhook data
        logger.info("UploadThing upload completed", event=payload.eventType)

    return {"status": "received", "event_type": payload.eventType}


@router.get("/", response_model=List[UploadedFile])
async def get_uploaded_files(
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get uploaded files for current tutor (tenant isolated)"""
    file_service = FileService(database)
    # List files for this tutor only (tenant isolated)
    return await file_service.list_tutor_files(tutor_id=current_user.clerk_id)


@router.get("/{file_id}", response_model=UploadedFile)
async def get_file(
    file_id: str = Path(..., description="File ID"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get file by ID (tutor only, with tenant isolation)"""
    file_service = FileService(database)

    # Get file with tenant isolation
    file = await file_service.get_file(
        file_id=file_id,
        user_id=current_user.clerk_id,
        tutor_id=current_user.clerk_id
    )
    if not file:
        raise HTTPException(status_code=404, detail="File not found or access denied")

    return file


@router.post("/{file_id}/process", response_model=FileProcessingResult)
async def process_file(
    file_id: str = Path(..., description="File ID"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Process file to generate questions (tutor only, with tenant isolation)"""
    file_service = FileService(database)
    question_service = QuestionService(database)

    # Process file with tenant isolation
    result = await file_service.process_file_for_questions(
        file_id=file_id,
        user_id=current_user.clerk_id,
        question_service=question_service
    )

    return result


@router.get("/{file_id}/status", response_model=FileProcessingResult)
async def get_file_processing_status(
    file_id: str = Path(..., description="File ID"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get file processing status (tutor only, with tenant isolation)"""
    file_service = FileService(database)
    return await file_service.get_processing_status(file_id, current_user.clerk_id)


@router.delete("/{file_id}")
async def delete_file(
    file_id: str = Path(..., description="File ID"),
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete file (tutor only, with tenant isolation)"""
    file_service = FileService(database)

    # Delete file with tenant isolation
    success = await file_service.delete_file(
        file_id=file_id,
        user_id=current_user.clerk_id,
        tutor_id=current_user.clerk_id
    )
    if not success:
        raise HTTPException(status_code=404, detail="File not found or access denied")

    return {"message": "File deleted successfully"}


@router.get("/storage/stats")
async def get_storage_stats(
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
) -> Dict[str, Any]:
    """Get storage statistics for current tutor (tenant isolated)"""
    file_service = FileService(database)
    # Get tenant-scoped storage stats
    return await file_service.get_storage_stats(tutor_id=current_user.clerk_id)
