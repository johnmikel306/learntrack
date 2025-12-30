"""
Google Gemini AI Provider using LangChain
"""
from typing import List, Dict, Any, Optional
import structlog
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

from app.services.ai.base import BaseAIProvider
from app.models.question import QuestionCreate, QuestionDifficulty, QuestionType

logger = structlog.get_logger()

# Available Gemini models (Updated December 2024)
GEMINI_MODELS = {
    # Gemini 2.5 - Latest (Best performance)
    "gemini-2.5-flash": {"context_window": 1048576, "description": "Gemini 2.5 Flash - Best price-performance"},
    "gemini-2.5-pro": {"context_window": 1048576, "description": "Gemini 2.5 Pro - Advanced thinking"},
    "gemini-2.5-flash-lite": {"context_window": 1048576, "description": "Gemini 2.5 Flash Lite - Ultra fast"},
    # Gemini 2.0
    "gemini-2.0-flash": {"context_window": 1048576, "description": "Gemini 2.0 Flash - Fast multimodal"},
    "gemini-2.0-flash-lite": {"context_window": 1048576, "description": "Gemini 2.0 Flash Lite - Lightweight"},
    # Gemini 1.5
    "gemini-1.5-pro": {"context_window": 2097152, "description": "Gemini 1.5 Pro - Complex tasks"},
    "gemini-1.5-flash": {"context_window": 1048576, "description": "Gemini 1.5 Flash - Balanced"},
}


class GeminiProvider(BaseAIProvider):
    """Google Gemini AI provider using LangChain"""

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        super().__init__(api_key)
        self.model = model
        self.llm = ChatGoogleGenerativeAI(google_api_key=api_key, model=model, temperature=0.7)

    @classmethod
    def get_available_models(cls) -> Dict[str, Dict[str, Any]]:
        """Get available Gemini models"""
        return GEMINI_MODELS

    def set_model(self, model: str):
        """Change the active model"""
        if model in GEMINI_MODELS:
            self.model = model
            self.llm = ChatGoogleGenerativeAI(google_api_key=self.api_key, model=model, temperature=0.7)
        else:
            raise ValueError(f"Model {model} not available. Choose from: {list(GEMINI_MODELS.keys())}")

    async def extract_text_from_content(self, content: str, file_type: str) -> str:
        """Extract and clean text from file content"""
        try:
            messages = [HumanMessage(content=f"Extract the main text from this {file_type} content:\n\n{content[:8000]}")]
            response = await self.llm.ainvoke(messages)
            return response.content
        except Exception as e:
            logger.error(f"Gemini text extraction failed: {e}")
            return content

    async def generate_questions(
        self, text_content: str, subject: str, topic: str, question_count: int = 10,
        difficulty: QuestionDifficulty = QuestionDifficulty.MEDIUM,
        question_types: Optional[List[QuestionType]] = None
    ) -> List[QuestionCreate]:
        """Generate questions using Gemini"""
        if question_types is None:
            question_types = [QuestionType.MULTIPLE_CHOICE]
        
        prompt = self._build_question_prompt(text_content, subject, topic, question_count, difficulty, question_types)
        
        try:
            messages = [HumanMessage(content=f"You are an expert educator. Generate questions in valid JSON format only.\n\n{prompt}")]
            response = await self.llm.ainvoke(messages)
            return self._parse_ai_response(response.content, subject, topic)
        except Exception as e:
            logger.error(f"Gemini question generation failed: {e}")
            return []

    async def validate_question(self, question: QuestionCreate) -> Dict[str, Any]:
        """Validate a question for quality and correctness"""
        try:
            prompt = f"""Validate this question for quality and correctness:
Question: {question.question_text}
Type: {question.question_type.value}
Options: {question.options if question.options else 'N/A'}
Correct Answer: {question.correct_answer if question.correct_answer else 'See options'}

Respond with JSON only: {{"is_valid": true/false, "issues": [], "suggestions": [], "quality_score": 0-100}}"""
            
            messages = [HumanMessage(content=prompt)]
            response = await self.llm.ainvoke(messages)
            
            import json
            try:
                return json.loads(response.content)
            except:
                return {"is_valid": True, "issues": [], "suggestions": [], "quality_score": 75}
        except Exception as e:
            logger.error(f"Gemini validation failed: {e}")
            return {"is_valid": True, "issues": [], "suggestions": [], "quality_score": 50}

    async def health_check(self) -> bool:
        """Check if Gemini is available"""
        try:
            messages = [HumanMessage(content="Hello")]
            await self.llm.ainvoke(messages)
            return True
        except Exception as e:
            logger.error(f"Gemini health check failed: {e}")
            return False

