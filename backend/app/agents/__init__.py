"""
LangGraph ReAct Agent for AI Question Generation

This module contains the agent architecture for generating educational questions
using LangGraph with ReAct (Reasoning + Acting) pattern.

Architecture:
- prompts/: Versioned system prompts for agent nodes
- graph/: LangGraph state, nodes, edges, and compiled graph
- tools/: Agent tools (material retrieval, formatting, etc.)
- streaming/: SSE event types and handlers
"""

from app.agents.graph.question_generator_graph import QuestionGeneratorAgent

__all__ = ["QuestionGeneratorAgent"]

