import json
from fastapi import APIRouter, Request, HTTPException, Depends
from svix.webhooks import Webhook, WebhookVerificationError
import structlog

from app.core.config import settings
from app.core.database import get_database
from app.services.user_service import UserService
from app.models.user import UserCreate, UserRole

logger = structlog.get_logger()
router = APIRouter()

@router.post("/clerk")
async def clerk_webhook(
    request: Request,
    db=Depends(get_database)
):
    """Handle Clerk webhook events for user creation and updates."""
    
    # Verify the webhook signature
    try:
        headers = request.headers
        payload = await request.body()
        svix_id = headers.get("svix-id")
        svix_timestamp = headers.get("svix-timestamp")
        svix_signature = headers.get("svix-signature")

        if not all([svix_id, svix_timestamp, svix_signature]):
            raise HTTPException(status_code=400, detail="Missing Svix headers")

        wh = Webhook(settings.CLERK_WEBHOOK_SECRET)
        evt = wh.verify(payload, headers)
        
    except WebhookVerificationError as e:
        logger.error("Webhook verification failed", error=str(e))
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        logger.error("Webhook processing error", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

    # Handle the event
    event_type = evt["type"]
    data = evt["data"]
    
    user_service = UserService(db)

    try:
        if event_type == "user.created":
            # Check both public_metadata and unsafe_metadata for role
            role_str = (
                data.get("public_metadata", {}).get("role") or
                data.get("unsafe_metadata", {}).get("role") or
                "student"
            )
            user_create = UserCreate(
                clerk_id=data["id"],
                email=next(item["email_address"] for item in data["email_addresses"] if item["verification"]["status"] == "verified"),
                name=f"{data.get('first_name', '')} {data.get('last_name', '')}".strip(),
                role=UserRole(role_str),
                tutor_id=data["id"] if role_str == "tutor" else None # Tutors are their own tenant
            )
            await user_service.create_user(user_create)
            logger.info("User created from webhook", clerk_id=data["id"])

        elif event_type == "user.updated":
            # Implement user update logic if needed
            logger.info("User updated event received (logic not implemented)", clerk_id=data["id"])
            pass

        return {"status": "success", "message": f"Handled event: {event_type}"}

    except Exception as e:
        logger.error("Error handling webhook event", event_type=event_type, error=str(e))
        # Return a 200 to Clerk even if our internal processing fails,
        # to prevent unnecessary retries for logic errors.
        return {"status": "error", "message": "Failed to process event internally"}
