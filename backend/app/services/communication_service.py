"""
Communication service to send messages (email/SMS) - development stub
"""
from datetime import datetime
from typing import Optional, Literal
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog

logger = structlog.get_logger()

class CommunicationService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.messages = database.messages

    async def send_message(
        self,
        *,
        student_id: Optional[str],
        to_email: Optional[str],
        to_phone: Optional[str],
        channel: Literal["email", "sms"],
        subject: Optional[str],
        body: str,
        metadata: Optional[dict] = None,
    ) -> dict:
        """Store message request and simulate sending (no external provider)"""
        payload = {
            "student_id": student_id,
            "to_email": to_email,
            "to_phone": to_phone,
            "channel": channel,
            "subject": subject,
            "body": body,
            "metadata": metadata or {},
            "status": "queued",
            "created_at": datetime.utcnow(),
        }
        result = await self.messages.insert_one(payload)
        logger.info("Message queued", message_id=str(result.inserted_id), channel=channel)
        return {"id": str(result.inserted_id), "status": "queued"}

