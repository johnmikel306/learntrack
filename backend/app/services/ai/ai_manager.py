"""
AI Manager for handling multiple AI providers with LangChain integration
"""
from typing import List, Dict, Any, Optional
import structlog

from app.core.config import settings
from app.services.ai.base import BaseAIProvider, AIProvider
from app.services.ai.openai_provider import OpenAIProvider
from app.services.ai.groq_provider import GroqProvider, GROQ_MODELS
from app.services.ai.gemini_provider import GeminiProvider, GEMINI_MODELS
from app.models.question import QuestionCreate, QuestionDifficulty, QuestionType
from app.core.exceptions import AIProviderError

logger = structlog.get_logger()


class AIManager:
    """Manager for multiple AI providers with LangChain integration"""

    def __init__(self, ai_settings: Optional[Dict[str, Any]] = None):
        self.providers: Dict[str, BaseAIProvider] = {}
        self.default_provider = AIProvider.OPENAI
        self.ai_settings = ai_settings or {}
        self._initialize_providers()

    def _initialize_providers(self):
        """Initialize available AI providers"""
        openai_key = self._get_api_key("openai") or settings.OPENAI_API_KEY
        anthropic_key = self._get_api_key("anthropic") or settings.ANTHROPIC_API_KEY
        google_key = self._get_api_key("google") or settings.GOOGLE_API_KEY
        groq_key = self._get_api_key("groq") or settings.GROQ_API_KEY
        gemini_key = self._get_api_key("gemini") or settings.GEMINI_API_KEY

        if self.ai_settings.get("default_provider"):
            self.default_provider = self.ai_settings["default_provider"]

        # OpenAI
        if openai_key:
            try:
                self.providers[AIProvider.OPENAI] = OpenAIProvider(openai_key)
                logger.info("OpenAI provider initialized")
            except Exception as e:
                logger.error("Failed to initialize OpenAI provider", error=str(e))

        # Groq (LangChain)
        if groq_key:
            try:
                self.providers[AIProvider.GROQ] = GroqProvider(groq_key)
                logger.info("Groq provider initialized")
            except Exception as e:
                logger.error("Failed to initialize Groq provider", error=str(e))

        # Gemini (LangChain)
        if gemini_key:
            try:
                self.providers[AIProvider.GEMINI] = GeminiProvider(gemini_key)
                logger.info("Gemini provider initialized")
            except Exception as e:
                logger.error("Failed to initialize Gemini provider", error=str(e))

        # Anthropic (placeholder)
        if anthropic_key:
            logger.info("Anthropic provider available but not implemented")

        # Google (placeholder - use Gemini instead)
        if google_key and not gemini_key:
            logger.info("Google API key found - use GEMINI_API_KEY for Gemini models")

        if not self.providers:
            logger.warning("No AI providers initialized")

    def _get_api_key(self, provider: str) -> Optional[str]:
        """Get API key for provider from database settings"""
        if not self.ai_settings:
            return None

        provider_settings = self.ai_settings.get("providers", {}).get(provider, {})
        return provider_settings.get("api_key") if provider_settings.get("enabled") else None
    
    def get_provider(self, provider_name: Optional[str] = None) -> BaseAIProvider:
        """Get AI provider by name or default"""
        if provider_name is None:
            provider_name = self.default_provider
        
        if provider_name not in self.providers:
            available = list(self.providers.keys())
            raise AIProviderError(
                f"Provider '{provider_name}' not available. Available providers: {available}",
                provider_name
            )
        
        return self.providers[provider_name]
    
    def get_available_providers(self) -> List[str]:
        """Get list of available providers"""
        return list(self.providers.keys())
    
    async def extract_text_from_content(
        self,
        content: str,
        file_type: str,
        provider_name: Optional[str] = None
    ) -> str:
        """Extract text using specified or default provider"""
        provider = self.get_provider(provider_name)
        return await provider.extract_text_from_content(content, file_type)
    
    async def generate_questions(
        self,
        text_content: str,
        subject: str,
        topic: str,
        question_count: int = 10,
        difficulty: QuestionDifficulty = QuestionDifficulty.MEDIUM,
        question_types: Optional[List[QuestionType]] = None,
        provider_name: Optional[str] = None
    ) -> List[QuestionCreate]:
        """Generate questions using specified or default provider"""
        provider = self.get_provider(provider_name)
        return await provider.generate_questions(
            text_content, subject, topic, question_count, difficulty, question_types
        )
    
    async def validate_question(
        self,
        question: QuestionCreate,
        provider_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Validate question using specified or default provider"""
        provider = self.get_provider(provider_name)
        return await provider.validate_question(question)
    
    async def health_check_all(self) -> Dict[str, bool]:
        """Check health of all providers"""
        results = {}
        for provider_name, provider in self.providers.items():
            try:
                results[provider_name] = await provider.health_check()
            except Exception as e:
                logger.error(f"Health check failed for {provider_name}", error=str(e))
                results[provider_name] = False
        
        return results
    
    async def generate_questions_with_fallback(
        self,
        text_content: str,
        subject: str,
        topic: str,
        question_count: int = 10,
        difficulty: QuestionDifficulty = QuestionDifficulty.MEDIUM,
        question_types: Optional[List[QuestionType]] = None,
        preferred_provider: Optional[str] = None
    ) -> tuple[List[QuestionCreate], str]:
        """Generate questions with fallback to other providers if primary fails"""
        providers_to_try = []
        
        # Add preferred provider first
        if preferred_provider and preferred_provider in self.providers:
            providers_to_try.append(preferred_provider)
        
        # Add other providers as fallbacks
        for provider_name in self.providers.keys():
            if provider_name not in providers_to_try:
                providers_to_try.append(provider_name)
        
        last_error = None
        for provider_name in providers_to_try:
            try:
                logger.info(f"Attempting question generation with {provider_name}")
                questions = await self.generate_questions(
                    text_content, subject, topic, question_count, 
                    difficulty, question_types, provider_name
                )
                
                if questions:
                    logger.info(f"Successfully generated {len(questions)} questions with {provider_name}")
                    return questions, provider_name
                
            except Exception as e:
                last_error = e
                logger.warning(f"Question generation failed with {provider_name}", error=str(e))
                continue
        
        # If all providers failed
        if last_error:
            raise AIProviderError(f"All providers failed. Last error: {str(last_error)}")
        else:
            raise AIProviderError("No questions generated by any provider")

    def get_available_models(self, provider_name: str) -> Dict[str, Dict[str, Any]]:
        """Get available models for a specific provider"""
        if provider_name == AIProvider.GROQ or provider_name == "groq":
            return GROQ_MODELS
        elif provider_name == AIProvider.GEMINI or provider_name == "gemini":
            return GEMINI_MODELS
        elif provider_name == AIProvider.OPENAI or provider_name == "openai":
            return {
                "gpt-4o": {"context_window": 128000, "description": "GPT-4o - Most capable"},
                "gpt-4o-mini": {"context_window": 128000, "description": "GPT-4o Mini - Fast and affordable"},
                "gpt-4-turbo": {"context_window": 128000, "description": "GPT-4 Turbo - High performance"},
            }
        return {}

    def set_provider_model(self, provider_name: str, model: str):
        """Set the model for a specific provider"""
        provider = self.get_provider(provider_name)
        if hasattr(provider, 'set_model'):
            provider.set_model(model)
        else:
            logger.warning(f"Provider {provider_name} does not support model switching")

    async def generate_questions_with_rag(
        self, text_content: str, rag_context: str, subject: str, topic: str,
        question_count: int = 10, difficulty: QuestionDifficulty = QuestionDifficulty.MEDIUM,
        question_types: Optional[List[QuestionType]] = None, provider_name: Optional[str] = None
    ) -> List[QuestionCreate]:
        """Generate questions using RAG-enhanced context"""
        combined_content = f"""
RETRIEVED CONTEXT FROM DOCUMENTS:
{rag_context}

ADDITIONAL CONTENT:
{text_content}
"""
        return await self.generate_questions(
            combined_content, subject, topic, question_count, difficulty, question_types, provider_name
        )


# Global AI manager instance
ai_manager = AIManager()
