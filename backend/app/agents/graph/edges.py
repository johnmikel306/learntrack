"""
LangGraph Edge Definitions

Conditional edge functions for routing in the question generation graph.
"""

from typing import Literal
from app.agents.graph.state import AgentState


def should_continue_after_analysis(state: AgentState) -> Literal["continue", "clarify", "error"]:
    """
    Determine next step after prompt analysis.
    
    Returns:
        - "continue": Proceed to material retrieval
        - "clarify": Need clarification from user
        - "error": Analysis failed
    """
    if state.get("error"):
        return "error"
    
    if state.get("needs_clarification"):
        return "clarify"
    
    return "continue"


def should_validate(state: AgentState) -> Literal["validate", "skip", "error"]:
    """
    Determine if validation should be run.
    
    Returns:
        - "validate": Run validation
        - "skip": Skip validation (no questions)
        - "error": Generation failed
    """
    if state.get("error"):
        return "error"
    
    questions = state.get("questions", [])
    if not questions:
        return "skip"
    
    return "validate"


def check_quality(state: AgentState) -> Literal["pass", "regenerate", "partial"]:
    """
    Check overall quality of generated questions.
    
    Returns:
        - "pass": All questions are valid
        - "regenerate": Too many invalid questions, regenerate
        - "partial": Some invalid, but acceptable
    """
    questions = state.get("questions", [])
    
    if not questions:
        return "regenerate"
    
    invalid_count = sum(1 for q in questions if not q.is_valid)
    invalid_ratio = invalid_count / len(questions)
    
    if invalid_ratio > 0.5:
        return "regenerate"
    elif invalid_ratio > 0:
        return "partial"
    
    return "pass"


def determine_completion(state: AgentState) -> Literal["complete", "continue", "error"]:
    """
    Determine if generation is complete.
    
    Returns:
        - "complete": All questions generated and valid
        - "continue": Need more questions
        - "error": Fatal error occurred
    """
    if state.get("error"):
        return "error"
    
    config = state.get("config")
    questions = state.get("questions", [])
    
    if not config:
        return "error"
    
    # Check if we have enough valid questions
    valid_count = sum(1 for q in questions if q.is_valid)
    
    if valid_count >= config.question_count:
        return "complete"
    
    return "continue"


# Edge mapping for graph construction
EDGE_MAPPINGS = {
    "after_analysis": {
        "continue": "retrieve_materials",
        "clarify": "end",
        "error": "end"
    },
    "after_generation": {
        "validate": "validate_questions",
        "skip": "end",
        "error": "end"
    },
    "after_validation": {
        "pass": "end",
        "regenerate": "generate_questions",
        "partial": "end"
    },
    "completion_check": {
        "complete": "end",
        "continue": "generate_questions",
        "error": "end"
    }
}

