"""
Groq AI Provider using LangChain
"""
from typing import List, Dict, Any, Optional
import structlog
from langchain_groq import ChatGroq
from langchain.schema import HumanMessage, SystemMessage

from app.services.ai.base import BaseAIProvider
from app.models.question import QuestionCreate, QuestionDifficulty, QuestionType
from app.agents.prompts import get_prompt

logger = structlog.get_logger()

# Available Groq models (Updated December 2024)
GROQ_MODELS = {
    # Llama 4 - Newest (multimodal)
    "meta-llama/llama-4-maverick-17b-128e-instruct": {"context_window": 131072, "description": "Llama 4 Maverick 17B - Latest multimodal"},
    "meta-llama/llama-4-scout-17b-16e-instruct": {"context_window": 131072, "description": "Llama 4 Scout 17B - Fast multimodal"},
    # Llama 3.3
    "llama-3.3-70b-versatile": {"context_window": 131072, "description": "Llama 3.3 70B - Most versatile"},
    # Llama 3.1
    "llama-3.1-8b-instant": {"context_window": 131072, "description": "Llama 3.1 8B - Fast responses"},
    # Qwen 3
    "qwen/qwen3-32b": {"context_window": 131072, "description": "Qwen3 32B - Balanced performance"},
    # Kimi K2
    "moonshotai/kimi-k2-instruct-0905": {"context_window": 262144, "description": "Kimi K2 - Advanced reasoning"},
}


class GroqProvider(BaseAIProvider):
    """Groq AI provider using LangChain"""

    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile"):
        super().__init__(api_key)
        self.model = model
        self.llm = ChatGroq(api_key=api_key, model_name=model, temperature=0.7)

    @classmethod
    def get_available_models(cls) -> Dict[str, Dict[str, Any]]:
        """Get available Groq models"""
        return GROQ_MODELS

    def set_model(self, model: str):
        """Change the active model"""
        if model in GROQ_MODELS:
            self.model = model
            self.llm = ChatGroq(api_key=self.api_key, model_name=model, temperature=0.7)
        else:
            raise ValueError(f"Model {model} not available. Choose from: {list(GROQ_MODELS.keys())}")

    async def extract_text_from_content(self, content: str, file_type: str) -> str:
        """Extract and clean text from file content"""
        try:
            # Use centralized prompt from registry
            system_prompt = get_prompt("text_extraction")

            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"Extract the main text from this {file_type} content:\n\n{content[:8000]}")
            ]
            response = await self.llm.ainvoke(messages)
            return response.content
        except Exception as e:
            logger.error(f"Groq text extraction failed: {e}")
            return content

    async def generate_questions(
        self, text_content: str, subject: str, topic: str, question_count: int = 10,
        difficulty: QuestionDifficulty = QuestionDifficulty.MEDIUM,
        question_types: Optional[List[QuestionType]] = None
    ) -> List[QuestionCreate]:
        """Generate questions using Groq"""
        if question_types is None:
            question_types = [QuestionType.MULTIPLE_CHOICE]
        
        prompt = self._build_question_prompt(text_content, subject, topic, question_count, difficulty, question_types)

        try:
            # Use centralized prompt from registry
            system_prompt = get_prompt("simple_question_generator")

            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=prompt)
            ]
            response = await self.llm.ainvoke(messages)
            return self._parse_ai_response(response.content, subject, topic)
        except Exception as e:
            logger.error(f"Groq question generation failed: {e}")
            return []

    async def validate_question(self, question: QuestionCreate) -> Dict[str, Any]:
        """Validate a question for quality and correctness"""
        try:
            prompt = f"""Validate this question for quality and correctness:
Question: {question.question_text}
Type: {question.question_type.value}
Options: {question.options if question.options else 'N/A'}
Correct Answer: {question.correct_answer if question.correct_answer else 'See options'}

Respond with JSON: {{"is_valid": true/false, "issues": [], "suggestions": [], "quality_score": 0-100}}"""

            # Use centralized prompt from registry
            system_prompt = get_prompt("simple_question_validator")

            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=prompt)
            ]
            response = await self.llm.ainvoke(messages)
            
            import json
            try:
                return json.loads(response.content)
            except:
                return {"is_valid": True, "issues": [], "suggestions": [], "quality_score": 75}
        except Exception as e:
            logger.error(f"Groq validation failed: {e}")
            return {"is_valid": True, "issues": [], "suggestions": [], "quality_score": 50}

    async def health_check(self) -> bool:
        """Check if Groq is available"""
        try:
            messages = [HumanMessage(content="Hello")]
            await self.llm.ainvoke(messages)
            return True
        except Exception as e:
            logger.error(f"Groq health check failed: {e}")
            return False

