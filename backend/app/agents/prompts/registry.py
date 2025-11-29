"""
Prompt Registry - Manages active prompt version and retrieval

This registry allows switching between prompt versions without code changes.
Useful for A/B testing, rollbacks, and gradual rollouts.
"""

from typing import Optional, Dict
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
]


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

