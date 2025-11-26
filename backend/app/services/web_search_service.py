"""
Web Search Service using Tavily API
Provides web search capabilities for RAG-enhanced question generation
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import structlog
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.models.rag import WebSearchResult, TutorRAGSettings

logger = structlog.get_logger()


class WebSearchService:
    """Web search service using Tavily API with credit management"""

    def __init__(self, db: AsyncIOMotorDatabase = None):
        self.db = db
        self.tavily_client = None
        self._initialize_tavily()

    def _initialize_tavily(self):
        """Initialize Tavily client"""
        try:
            tavily_key = getattr(settings, 'TAVILY_API_KEY', None)
            if tavily_key:
                from tavily import TavilyClient
                self.tavily_client = TavilyClient(api_key=tavily_key)
                logger.info("Tavily client initialized")
            else:
                logger.warning("Tavily API key not configured")
        except Exception as e:
            logger.error(f"Failed to initialize Tavily client: {e}")
            self.tavily_client = None

    async def search(
        self, query: str, tutor_id: str, max_results: int = 5, search_depth: str = "basic"
    ) -> List[WebSearchResult]:
        """Perform web search and return results"""
        if not self.tavily_client:
            logger.warning("Tavily client not available")
            return []
        
        # Check credits
        has_credits = await self._check_and_deduct_credits(tutor_id)
        if not has_credits:
            logger.warning(f"Tutor {tutor_id} has no web search credits")
            return []
        
        try:
            response = self.tavily_client.search(
                query=query, max_results=max_results, search_depth=search_depth,
                include_answer=True, include_raw_content=False
            )
            
            results = []
            for item in response.get("results", []):
                result = WebSearchResult(
                    title=item.get("title", ""),
                    url=item.get("url", ""),
                    content=item.get("content", ""),
                    score=item.get("score", 0.0),
                    published_date=item.get("published_date")
                )
                results.append(result)
            
            # Log search
            await self._log_search(tutor_id, query, len(results))
            return results
            
        except Exception as e:
            logger.error(f"Web search failed: {e}")
            return []

    async def search_for_context(
        self, topic: str, subject: str, tutor_id: str, max_results: int = 3
    ) -> str:
        """Search web for additional context on a topic"""
        query = f"{subject} {topic} educational content explanation"
        results = await self.search(query, tutor_id, max_results)
        
        if not results:
            return ""
        
        context_parts = []
        for result in results:
            context_parts.append(f"Source: {result.title}\n{result.content}\n")
        
        return "\n---\n".join(context_parts)

    async def _check_and_deduct_credits(self, tutor_id: str) -> bool:
        """Check if tutor has credits and deduct one"""
        if not self.db:
            return True  # Allow if no DB (development mode)
        
        try:
            settings_doc = await self.db.tutor_rag_settings.find_one({"tutor_id": tutor_id})
            if not settings_doc:
                # Create default settings with 100 credits
                await self.db.tutor_rag_settings.insert_one({
                    "tutor_id": tutor_id, "web_search_credits": 100, "web_search_enabled": True,
                    "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)
                })
                settings_doc = {"web_search_credits": 100, "web_search_enabled": True}
            
            if not settings_doc.get("web_search_enabled", True):
                return False
            
            credits = settings_doc.get("web_search_credits", 0)
            if credits <= 0:
                return False
            
            # Deduct credit
            await self.db.tutor_rag_settings.update_one(
                {"tutor_id": tutor_id},
                {"$inc": {"web_search_credits": -1}, "$set": {"updated_at": datetime.now(timezone.utc)}}
            )
            return True
        except Exception as e:
            logger.error(f"Credit check failed: {e}")
            return True  # Allow on error

    async def _log_search(self, tutor_id: str, query: str, result_count: int):
        """Log search for analytics"""
        if not self.db:
            return
        try:
            await self.db.web_search_logs.insert_one({
                "tutor_id": tutor_id, "query": query, "result_count": result_count,
                "created_at": datetime.now(timezone.utc)
            })
        except Exception as e:
            logger.error(f"Failed to log search: {e}")

    async def get_remaining_credits(self, tutor_id: str) -> int:
        """Get remaining web search credits for tutor"""
        if not self.db:
            return 100
        try:
            settings_doc = await self.db.tutor_rag_settings.find_one({"tutor_id": tutor_id})
            return settings_doc.get("web_search_credits", 0) if settings_doc else 100
        except Exception as e:
            logger.error(f"Failed to get credits: {e}")
            return 0

    async def add_credits(self, tutor_id: str, credits: int) -> int:
        """Add web search credits to tutor account"""
        if not self.db:
            return credits
        try:
            result = await self.db.tutor_rag_settings.find_one_and_update(
                {"tutor_id": tutor_id},
                {"$inc": {"web_search_credits": credits}, "$set": {"updated_at": datetime.now(timezone.utc)}},
                return_document=True
            )
            return result.get("web_search_credits", credits) if result else credits
        except Exception as e:
            logger.error(f"Failed to add credits: {e}")
            return 0

