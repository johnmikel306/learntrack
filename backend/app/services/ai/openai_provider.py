"""
OpenAI provider implementation
"""
from typing import List, Dict, Any, Optional
import asyncio
import structlog
from openai import AsyncOpenAI

from app.services.ai.base import BaseAIProvider
from app.models.question import QuestionCreate, QuestionDifficulty, QuestionType
from app.core.exceptions import AIProviderError

logger = structlog.get_logger()

# Available OpenAI models (Updated December 2024)
OPENAI_MODELS = {
    # GPT-4o - Latest flagship
    "gpt-4o": {"context_window": 128000, "description": "GPT-4o - Most capable multimodal"},
    "gpt-4o-mini": {"context_window": 128000, "description": "GPT-4o Mini - Fast and affordable"},
    # o3 Reasoning models - Newest
    "o3-mini": {"context_window": 200000, "description": "o3 Mini - Latest reasoning model"},
    # o1 Reasoning models
    "o1": {"context_window": 200000, "description": "o1 - Advanced reasoning"},
    "o1-mini": {"context_window": 128000, "description": "o1 Mini - Fast reasoning"},
    # GPT-4 Turbo
    "gpt-4-turbo": {"context_window": 128000, "description": "GPT-4 Turbo - High performance"},
}


class OpenAIProvider(BaseAIProvider):
    """OpenAI provider for question generation"""

    def __init__(self, api_key: str, model: str = "gpt-4o"):
        super().__init__(api_key)
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model

    @classmethod
    def get_available_models(cls) -> Dict[str, Dict[str, Any]]:
        """Get available OpenAI models"""
        return OPENAI_MODELS

    def set_model(self, model: str):
        """Change the active model"""
        if model in OPENAI_MODELS:
            self.model = model
        else:
            raise ValueError(f"Model {model} not available. Choose from: {list(OPENAI_MODELS.keys())}")
    
    async def extract_text_from_content(self, content: str, file_type: str) -> str:
        """Extract and clean text from file content using OpenAI"""
        try:
            if file_type == "text/plain":
                return content
            
            # For other file types, use OpenAI to extract and clean text
            prompt = f"""
            Extract and clean the text content from the following {file_type} content.
            Remove any formatting artifacts, headers, footers, and irrelevant metadata.
            Return only the main educational content that would be useful for generating questions.
            
            Content:
            {content[:8000]}  # Limit to avoid token limits
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a text extraction specialist."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000,
                temperature=0.1
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error("OpenAI text extraction failed", error=str(e))
            raise AIProviderError(f"Text extraction failed: {str(e)}", "openai")
    
    async def generate_questions(
        self,
        text_content: str,
        subject: str,
        topic: str,
        question_count: int = 10,
        difficulty: QuestionDifficulty = QuestionDifficulty.MEDIUM,
        question_types: Optional[List[QuestionType]] = None
    ) -> List[QuestionCreate]:
        """Generate questions using OpenAI"""
        try:
            if question_types is None:
                question_types = [QuestionType.MULTIPLE_CHOICE, QuestionType.SHORT_ANSWER]
            
            prompt = self._build_question_prompt(
                text_content, subject, topic, question_count, difficulty, question_types
            )
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are an expert educator and assessment designer. Generate high-quality educational questions in valid JSON format."
                    },
                    {"role": "user", "content": prompt}
                ],
                max_tokens=4000,
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            response_text = response.choices[0].message.content
            questions = self._parse_ai_response(response_text, subject, topic)
            
            logger.info("OpenAI questions generated", count=len(questions), subject=subject, topic=topic)
            return questions
            
        except Exception as e:
            logger.error("OpenAI question generation failed", error=str(e))
            raise AIProviderError(f"Question generation failed: {str(e)}", "openai")
    
    async def validate_question(self, question: QuestionCreate) -> Dict[str, Any]:
        """Validate a question using OpenAI"""
        try:
            prompt = f"""
            Evaluate the following educational question for quality and correctness:
            
            Question: {question.question_text}
            Type: {question.question_type}
            Subject: {question.subject_id}
            Topic: {question.topic}
            Difficulty: {question.difficulty}
            
            Options: {question.options if question.options else 'N/A'}
            Correct Answer: {question.correct_answer if question.correct_answer else 'N/A'}
            Explanation: {question.explanation if question.explanation else 'N/A'}
            
            Provide a validation report with:
            1. Overall quality score (1-10)
            2. Clarity score (1-10)
            3. Difficulty appropriateness (1-10)
            4. Any issues or suggestions for improvement
            5. Whether the question is acceptable (true/false)
            
            Format as JSON.
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an educational assessment expert."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            import json
            validation_result = json.loads(response.choices[0].message.content)
            
            return validation_result
            
        except Exception as e:
            logger.error("OpenAI question validation failed", error=str(e))
            return {
                "quality_score": 5,
                "clarity_score": 5,
                "difficulty_score": 5,
                "issues": [f"Validation failed: {str(e)}"],
                "acceptable": True  # Default to acceptable if validation fails
            }
    
    async def health_check(self) -> bool:
        """Check OpenAI API health"""
        try:
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",  # Use cheaper model for health check
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=5
            )
            return response.choices[0].message.content is not None
        except Exception as e:
            logger.error("OpenAI health check failed", error=str(e))
            return False
