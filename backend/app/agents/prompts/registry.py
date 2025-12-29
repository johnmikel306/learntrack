"""
Prompt Registry - Manages active prompt version and retrieval

This registry allows switching between prompt versions without code changes.
Useful for A/B testing, rollbacks, and gradual rollouts.
"""

from typing import Optional, Dict, Any
import importlib
import structlog

logger = structlog.get_logger()

# Active prompt version - change this to switch versions globally
ACTIVE_VERSION = "v1"

# Available prompt types
PROMPT_TYPES = [
    "prompt_analyzer",
    "question_generator",
    "question_validator",
    "question_editor",
    "formatter",
    # Simple prompts for provider-level operations
    "text_extraction",
    "simple_question_generator",
    "simple_question_validator",
]

# RAG prompt types (handled separately)
RAG_PROMPT_TYPES = [
    "query_analyzer",
    "relevance_grader",
    "query_rewriter",
    "answer_generator",
    "hallucination_checker",
    "simple_query",
    "document_summary",
    "multi_document_synthesis",
]


class PromptRegistry:
    """Registry for managing prompts across different modules."""

    def __init__(self, version: Optional[str] = None):
        self.version = version or ACTIVE_VERSION
        self._rag_prompts = None

    def get_prompt(self, module: str, prompt_type: str, **kwargs) -> str:
        """
        Get a prompt by module and type with variable substitution.

        Args:
            module: Module name (e.g., "rag", "question_generator")
            prompt_type: Prompt type within the module
            **kwargs: Variables to substitute in the prompt

        Returns:
            Formatted prompt string
        """
        if module == "rag":
            return self._get_rag_prompt(prompt_type, **kwargs)
        else:
            # Fall back to legacy get_prompt for other modules
            prompt = get_prompt(prompt_type, self.version)
            if kwargs:
                return prompt.format(**kwargs)
            return prompt

    def _get_rag_prompt(self, prompt_type: str, **kwargs) -> str:
        """Get a RAG prompt with variable substitution."""
        if self._rag_prompts is None:
            from app.agents.prompts.v1.rag_prompts import RAG_PROMPTS
            self._rag_prompts = RAG_PROMPTS

        if prompt_type not in self._rag_prompts:
            raise ValueError(f"Unknown RAG prompt: {prompt_type}")

        template = self._rag_prompts[prompt_type]
        if kwargs:
            return template.format(**kwargs)
        return template


def get_prompt(prompt_type: str, version: Optional[str] = None) -> str:
    """
    Get a system prompt by type and version.
    
    Args:
        prompt_type: One of PROMPT_TYPES (e.g., "question_generator")
        version: Optional version string (e.g., "v1"). Defaults to ACTIVE_VERSION.
    
    Returns:
        The system prompt string.
    
    Raises:
        ValueError: If prompt_type is invalid
        ImportError: If version module doesn't exist
    """
    if prompt_type not in PROMPT_TYPES:
        raise ValueError(f"Invalid prompt type: {prompt_type}. Must be one of {PROMPT_TYPES}")
    
    version = version or ACTIVE_VERSION
    
    try:
        module = importlib.import_module(f"app.agents.prompts.{version}.{prompt_type}")
        prompt = getattr(module, "SYSTEM_PROMPT", None)
        
        if prompt is None:
            raise ValueError(f"No SYSTEM_PROMPT found in {version}/{prompt_type}")
        
        logger.debug("Loaded prompt", prompt_type=prompt_type, version=version)
        return prompt
        
    except ImportError as e:
        logger.error("Failed to load prompt", prompt_type=prompt_type, version=version, error=str(e))
        raise ImportError(f"Prompt version {version}/{prompt_type} not found: {e}")


def get_all_prompts(version: Optional[str] = None) -> Dict[str, str]:
    """
    Get all prompts for a specific version.
    
    Args:
        version: Optional version string. Defaults to ACTIVE_VERSION.
    
    Returns:
        Dictionary mapping prompt_type to prompt string.
    """
    version = version or ACTIVE_VERSION
    prompts = {}
    
    for prompt_type in PROMPT_TYPES:
        try:
            prompts[prompt_type] = get_prompt(prompt_type, version)
        except (ImportError, ValueError) as e:
            logger.warning("Skipping prompt", prompt_type=prompt_type, error=str(e))
    
    return prompts

