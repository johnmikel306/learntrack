"""
File handling endpoints
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Path, UploadFile, File, Form
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.enhanced_auth import require_tutor, require_authenticated_user, ClerkUserContext
from app.models.file import (
    FileRegistrationResponse, FileProcessingResult, UploadedFile,
    FileMetadataRequest, UploadThingWebhookPayload
)
from app.services.file_service import FileService
from app.services.user_service import UserService
from app.services.question_service import QuestionService

router = APIRouter()

@router.post("/register", response_model=FileRegistrationResponse)
async def register_file_metadata(
    request: FileMetadataRequest,
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Register file metadata after UploadThing upload (tutor only)"""
    user_service = UserService(database)
    file_service = FileService(database)

    # Get current user from database
    user = await user_service.get_user_by_auth0_id(current_user.auth0_id)

    # Register file metadata
    uploaded_file = await file_service.register_file_metadata(request, str(user.id))

    return FileRegistrationResponse(
        file_id=str(uploaded_file.id),
        filename=uploaded_file.filename,
        size=uploaded_file.size,
        status=uploaded_file.status,
        uploadthing_url=str(uploaded_file.uploadthing_url),
        message="File metadata registered successfully"
    )

@router.post("/webhook")
async def uploadthing_webhook(    payload: UploadThingWebhookPayload):    """Handle UploadThing webhooks"""
    # This endpoint can be used for automatic file processing
    # when UploadThing sends webhooks after file uploads

    if payload.eventType == "upload.completed":
        # Handle completed upload
        # You could automatically register the file metadata here
        # or trigger processing based on the webhook data
        pass

    return {"status": "received", "event_type": payload.eventType}

@router.get("/", response_model=List[UploadedFile])
async def get_uploaded_files(    ):    """Get uploaded files for current user (tutor only)"""
    user_service = Service(database)
    file_service = Service(database)

    # Get current user from database
    user = await user_service.get_user_by_auth0_id()

    return await file_service.list_user_files(str(user.id))

@router.get("/{file_id}", response_model=UploadedFile)
async def get_file(    file_id: str = Path(..., description="File ID")):    """Get file by ID (tutor only)"""
    user_service = Service(database)
    file_service = Service(database)

    # Get current user from database
    user = await user_service.get_user_by_auth0_id()

    file = await file_service.get_file(file_id, str(user.id))
    if not file:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="File not found")

    return file

@router.post("/{file_id}/process", response_model=FileProcessingResult)
async def process_file(    file_id: str = Path(..., description="File ID")):    """Process file to generate questions (tutor only)"""
    user_service = Service(database)
    file_service = Service(database)
    question_service = Service(database)

    # Get current user from database
    user = await user_service.get_user_by_auth0_id()

    # Process file
    result = await file_service.process_file_for_questions(
        file_id=file_id,
        user_id=str(user.id),
        question_service=question_service
    )

    return result

@router.get("/{file_id}/status", response_model=FileProcessingResult)
async def get_file_processing_status(    file_id: str = Path(..., description="File ID")):    """Get file processing status (tutor only)"""
    user_service = Service(database)
    file_service = Service(database)

    # Get current user from database
    user = await user_service.get_user_by_auth0_id()

    return await file_service.get_processing_status(file_id, str(user.id))

@router.delete("/{file_id}")
async def delete_file(    file_id: str = Path(..., description="File ID")):    """Delete file (tutor only)"""
    user_service = Service(database)
    file_service = Service(database)

    # Get current user from database
    user = await user_service.get_user_by_auth0_id()

    success = await file_service.delete_file(file_id, str(user.id))
    if not success:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="File not found")

    return {"message": "File deleted successfully"}

@router.get("/storage/stats")
async def get_storage_stats(    Any] ):    """Get storage statistics (tutor only)"""
    file_service = Service(database)
    return await file_service.get_storage_stats()
