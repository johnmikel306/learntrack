"""
Versioned System Prompts for Question Generator Agent

This module manages versioned system prompts for the agent nodes.
Each version is in its own folder (v1/, v2/, etc.) for easy versioning and rollback.

Usage:
    from app.agents.prompts import get_prompt
    
    prompt = get_prompt("question_generator")  # Gets from active version
    prompt = get_prompt("question_generator", version="v1")  # Gets specific version
"""

from app.agents.prompts.registry import get_prompt, get_all_prompts, ACTIVE_VERSION

__all__ = ["get_prompt", "get_all_prompts", "ACTIVE_VERSION"]

