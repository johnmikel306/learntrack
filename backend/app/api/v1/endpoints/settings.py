"""
Settings management endpoints
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.models.settings import (
    AppSettings, SettingsUpdateRequest, SettingsResponse,
    AIProvider, AIProviderConfig
)
from app.services.settings_service import SettingsService

router = APIRouter()

@router.get("/", response_model=SettingsResponse)
async def get_settings(    ):    """Get current application settings (tutor only)"""
    service = Service(database)
    settings = await service.get_settings()
    
    # Convert to response model and mask sensitive data
    response = SettingsResponse(
        ai=settings.ai,
        general=settings.general,
        upload=settings.upload
    )
    return response.mask_sensitive_data()

@router.put("/", response_model=SettingsResponse)
async def update_settings(    update_request: SettingsUpdateRequest):    """Update application settings (tutor only)"""
    service = Service(database)
    
    try:
        updated_settings = await service.update_settings(update_request)
        
        # Convert to response model and mask sensitive data
        response = SettingsResponse(
            ai=updated_settings.ai,
            general=updated_settings.general,
            upload=updated_settings.upload
        )
        return response.mask_sensitive_data()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update settings: {str(e)}")

@router.put("/ai/{provider}")
async def update_ai_provider(    provider: AIProvider,    config: AIProviderConfig):    """Update AI provider configuration (tutor only)"""
    service = Service(database)
    
    try:
        updated_settings = await service.update_ai_provider(
            provider=provider,
            api_key=config.api_key,
            enabled=config.enabled,
            default_model=config.default_model
        )
        
        # Return just the updated provider config
        provider_config = updated_settings.ai.get_provider_config(provider)
        if provider_config and provider_config.api_key:
            # Mask the API key in response
            key = provider_config.api_key
            if len(key) > 12:
                provider_config.api_key = f"{key[:8]}...{key[-4:]}"
            else:
                provider_config.api_key = "***"
        
        return {
            "provider": provider.value,
            "config": provider_config,
            "message": f"{provider.value} configuration updated successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update AI provider: {str(e)}")

@router.post("/ai/{provider}/test")
async def test_ai_provider(    provider: AIProvider):    """Test AI provider connection (tutor only)"""
    service = Service(database)
    
    try:
        result = await service.test_ai_provider(provider)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to test AI provider: {str(e)}")

@router.get("/ai/providers")
async def get_available_providers(    ):    """Get list of available AI providers and their status (tutor only)"""
    service = Service(database)
    settings = await service.get_settings()
    
    providers_status = {}
    for provider_name, config in settings.ai.providers.items():
        providers_status[provider_name] = {
            "enabled": config.enabled,
            "configured": config.api_key is not None,
            "models": config.models,
            "default_model": config.default_model
        }
    
    return {
        "providers": providers_status,
        "default_provider": settings.ai.default_provider.value
    }

@router.put("/ai/default/{provider}")
async def set_default_ai_provider(    provider: AIProvider):    """Set default AI provider (tutor only)"""
    service = Service(database)
    settings = await service.get_settings()
    
    # Check if provider is configured and enabled
    if not settings.ai.is_provider_enabled(provider):
        raise HTTPException(
            status_code=400, 
            detail=f"Provider {provider.value} is not configured or enabled"
        )
    
    # Update default provider
    settings.ai.default_provider = provider
    updated_settings = await service.update_settings(SettingsUpdateRequest(ai=settings.ai))
    
    return {
        "default_provider": provider.value,
        "message": f"Default AI provider set to {provider.value}"
    }
