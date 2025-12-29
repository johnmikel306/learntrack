"""
Agentic RAG Edge Functions

Routing functions for the self-corrective RAG graph.
"""

from typing import Literal
from app.agents.rag.state import RAGState, RAGAction


def route_after_query_analysis(state: RAGState) -> Literal["retrieve", "fail"]:
    """Route after query analysis"""
    if state.get("error"):
        return "fail"
    return "retrieve"


def route_after_retrieval(state: RAGState) -> Literal["grade", "fail"]:
    """Route after document retrieval"""
    if state.get("error"):
        return "fail"
    return "grade"


def route_after_grading(state: RAGState) -> Literal["generate", "rewrite", "fail"]:
    """Route after relevance grading"""
    next_action = state.get("next_action")
    
    if next_action == RAGAction.GENERATE:
        return "generate"
    elif next_action == RAGAction.REWRITE:
        return "rewrite"
    else:
        return "fail"


def route_after_rewrite(state: RAGState) -> Literal["retrieve", "fail"]:
    """Route after query rewriting"""
    if state.get("error"):
        return "fail"
    return "retrieve"


def route_after_generation(state: RAGState) -> Literal["check_hallucination", "complete", "fail"]:
    """Route after answer generation"""
    next_action = state.get("next_action")
    
    if next_action == RAGAction.CHECK_HALLUCINATION:
        return "check_hallucination"
    elif next_action == RAGAction.COMPLETE:
        return "complete"
    else:
        return "fail"


def route_after_hallucination_check(state: RAGState) -> Literal["complete", "regenerate", "fail"]:
    """Route after hallucination check"""
    next_action = state.get("next_action")
    
    # Could add regeneration logic here
    if next_action == RAGAction.COMPLETE:
        return "complete"
    else:
        return "fail"


def should_continue_retrieval(state: RAGState) -> bool:
    """Check if we should continue trying to retrieve"""
    config = state.get("config")
    attempts = state.get("retrieval_attempts", 0)
    max_attempts = config.max_retrieval_attempts if config else 3
    
    return attempts < max_attempts

