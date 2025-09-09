"""
Communications endpoints for sending messages to parents/students
"""
from typing import Optional, Dict, Any, Literal
from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.services.communication_service import CommunicationService

router = APIRouter()

class MessageRequest(BaseModel):
    student_id: Optional[str] = None
    to_email: Optional[EmailStr] = None
    to_phone: Optional[str] = None
    channel: Literal["email", "sms"]
    subject: Optional[str] = None
    body: str

@router.post("/send")
async def send_message(    payload: MessageRequest):    service = Service(database)
    result = await service.send_message(
        student_id=payload.student_id,
        to_email=payload.to_email,
        to_phone=payload.to_phone,
        channel=payload.channel,
        subject=payload.subject,
        body=payload.body)
    return result

