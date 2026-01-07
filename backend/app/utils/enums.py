"""
Shared enumerations and normalization utilities.

This module centralizes the definitions and normalization logic for
enums like QuestionType and Difficulty to avoid duplication across the codebase.
"""
from typing import Optional, Any
from app.models.question import QuestionType, QuestionDifficulty
from app.agents.graph.state import BloomsLevel

# Provider name aliases - normalizes variations to canonical names
# The backend uses "gemini" but some legacy code/settings use "google"
PROVIDER_ALIASES = {
    "google": "gemini",
    "google-gemini": "gemini",
    "gemini": "gemini",
    "openai": "openai",
    "gpt": "openai",
    "groq": "groq",
    "anthropic": "anthropic",
    "claude": "anthropic",
}

QUESTION_TYPE_ALIASES = {
    "mcq": "multiple-choice",
    "multiple_choice": "multiple-choice",
    "multiple-choice": "multiple-choice",
    "multiple choice": "multiple-choice",
    "true_false": "true-false",
    "true-false": "true-false",
    "true false": "true-false",
    "true/false": "true-false",
    "short_answer": "short-answer",
    "short-answer": "short-answer",
    "short answer": "short-answer",
    "essay": "essay",
}

DIFFICULTY_ALIASES = {
    "easy": "easy",
    "beginner": "easy",
    "low": "easy",
    "medium": "medium",
    "intermediate": "medium",
    "hard": "hard",
    "advanced": "hard",
    "high": "hard",
    "mixed": "mixed", # Added from other files
}


def normalize_question_type(value: Optional[str]) -> QuestionType:
    """Normalize various string inputs into a valid QuestionType enum."""
    if isinstance(value, QuestionType):
        return value
    if not value:
        return QuestionType.MULTIPLE_CHOICE
    raw = str(value).strip()
    key = raw.lower().replace("/", " ").replace("_", " ").replace("-", " ").strip()
    alias = QUESTION_TYPE_ALIASES.get(key) or QUESTION_TYPE_ALIASES.get(raw.lower()) or raw.lower()
    alias = alias.replace(" ", "-")
    try:
        return QuestionType(alias)
    except ValueError:
        return QuestionType.MULTIPLE_CHOICE


def normalize_difficulty(value: Optional[str]) -> QuestionDifficulty:
    """Normalize various string inputs into a valid QuestionDifficulty enum."""
    if isinstance(value, QuestionDifficulty):
        return value
    if not value:
        return QuestionDifficulty.MEDIUM
    raw = str(value).strip()
    key = raw.lower().replace("/", " ").replace("_", " ").replace("-", " ").strip()
    alias = DIFFICULTY_ALIASES.get(key) or DIFFICULTY_ALIASES.get(raw.lower()) or raw.lower()
    try:
        return QuestionDifficulty(alias)
    except ValueError:
        return QuestionDifficulty.MEDIUM


def normalize_provider(value: Optional[str]) -> str:
    """
    Normalize AI provider names to canonical form.

    Handles legacy naming (e.g., 'google' -> 'gemini') and common aliases.
    Returns the original value if no alias is found.
    """
    if not value:
        return "groq"  # Default provider

    raw = str(value).strip().lower()
    return PROVIDER_ALIASES.get(raw, raw)


# Bloom's Taxonomy level aliases - handles case variations from LLM output
BLOOMS_LEVEL_ALIASES = {
    "remember": "REMEMBER",
    "remembering": "REMEMBER",
    "knowledge": "REMEMBER",
    "recall": "REMEMBER",
    "understand": "UNDERSTAND",
    "understanding": "UNDERSTAND",
    "comprehension": "UNDERSTAND",
    "comprehend": "UNDERSTAND",
    "apply": "APPLY",
    "applying": "APPLY",
    "application": "APPLY",
    "analyze": "ANALYZE",
    "analyse": "ANALYZE",
    "analyzing": "ANALYZE",
    "analysis": "ANALYZE",
    "evaluate": "EVALUATE",
    "evaluating": "EVALUATE",
    "evaluation": "EVALUATE",
    "create": "CREATE",
    "creating": "CREATE",
    "synthesis": "CREATE",
    "synthesize": "CREATE",
}


def normalize_blooms_level(value: Optional[str]) -> BloomsLevel:
    """Normalize various string inputs into a valid BloomsLevel enum.

    Handles case variations like 'Apply', 'apply', 'APPLY', 'Application' etc.
    """
    if isinstance(value, BloomsLevel):
        return value
    if not value:
        return BloomsLevel.UNDERSTAND  # Default

    raw = str(value).strip()
    # Try direct uppercase match first
    try:
        return BloomsLevel(raw.upper())
    except ValueError:
        pass

    # Try alias lookup
    key = raw.lower()
    alias = BLOOMS_LEVEL_ALIASES.get(key)
    if alias:
        try:
            return BloomsLevel(alias)
        except ValueError:
            pass

    # Default fallback
    return BloomsLevel.UNDERSTAND
