from fastapi import APIRouter, Request, HTTPException
from clerk_sdk.webhook import Webhook
from app.core.config import settings
from app.services.user_service import UserService
from app.models.user import UserCreate

router = APIRouter()

@router.post("/clerk")
async def clerk_webhook(request: Request):
    headers = request.headers
    payload = await request.body()
    
    try:
        webhook = Webhook(settings.CLERK_WEBHOOK_SECRET)
        evt = webhook.verify(payload, headers)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Error verifying webhook") from e

    if evt["type"] == "user.created":
        user_data = evt["data"]
        email = user_data.get("email_addresses", [{}])[0].get("email_address")
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
            
        user_create = UserCreate(
            clerk_id=user_data["id"],
            email=email,
            first_name=user_data.get("first_name"),
            last_name=user_data.get("last_name"),
            image_url=user_data.get("image_url"),
        )
        await UserService.create_user(user_create)

    return {"status": "ok"}
