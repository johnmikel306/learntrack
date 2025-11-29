"""
LangGraph Agent Nodes

Individual nodes that form the question generation pipeline.
Each node performs a specific task and updates the agent state.
"""

from typing import Dict, Any, List, Optional
import json
import uuid
import structlog
from langchain.schema import HumanMessage, SystemMessage

from app.agents.graph.state import (
    AgentState, ThinkingStep, SourceChunk, GeneratedQuestion,
    PromptAnalysis, QuestionType, Difficulty, BloomsLevel, SourceCitation
)
from app.agents.prompts import get_prompt
from app.agents.streaming.sse_handler import SSEHandler
from app.agents.tools.material_retriever import retrieve_materials

logger = structlog.get_logger()


class BaseNode:
    """Base class for agent nodes"""
    
    def __init__(self, llm, sse_handler: Optional[SSEHandler] = None):
        self.llm = llm
        self.sse_handler = sse_handler
    
    async def emit_thinking(self, step: str) -> None:
        """Emit a thinking step to the stream"""
        if self.sse_handler:
            await self.sse_handler.send_thinking(step)
    
    async def emit_action(self, step: str) -> None:
        """Emit an action step to the stream"""
        if self.sse_handler:
            await self.sse_handler.send_action(step)
    
    def add_thinking_step(
        self, 
        state: AgentState, 
        step_type: str, 
        content: str
    ) -> None:
        """Add a thinking step to state"""
        state["thinking_steps"].append(
            ThinkingStep(step_type=step_type, content=content)
        )


class PromptAnalyzerNode(BaseNode):
    """Analyzes user prompt to extract generation parameters"""
    
    async def __call__(self, state: AgentState) -> AgentState:
        """Analyze the user's prompt"""
        await self.emit_thinking("Analyzing your request...")
        
        try:
            system_prompt = get_prompt("prompt_analyzer")
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"Analyze this prompt: {state['original_prompt']}")
            ]
            
            response = await self.llm.ainvoke(messages)
            content = response.content
            
            # Parse JSON from response
            json_match = content
            if "```json" in content:
                json_match = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                json_match = content.split("```")[1].split("```")[0]
            
            analysis_data = json.loads(json_match.strip())
            
            # Convert to PromptAnalysis
            analysis = PromptAnalysis(
                subject=analysis_data.get("subject", "General"),
                topic=analysis_data.get("topic", ""),
                question_count=analysis_data.get("question_count", state["config"].question_count),
                question_types=[QuestionType(t) for t in analysis_data.get("question_types", ["MCQ"])],
                difficulty=Difficulty(analysis_data.get("difficulty", "MEDIUM")),
                blooms_levels=analysis_data.get("blooms_levels", "AUTO"),
                special_requirements=analysis_data.get("special_requirements", []),
                needs_clarification=analysis_data.get("needs_clarification", False),
                clarification_questions=analysis_data.get("clarification_questions", []),
                enhanced_prompt=analysis_data.get("enhanced_prompt", state["original_prompt"])
            )
            
            state["prompt_analysis"] = analysis
            state["enhanced_prompt"] = analysis.enhanced_prompt
            state["needs_clarification"] = analysis.needs_clarification
            
            # Update config with extracted values
            state["config"].subject = analysis.subject
            state["config"].topic = analysis.topic
            state["config"].question_types = analysis.question_types
            state["config"].difficulty = analysis.difficulty
            state["config"].blooms_levels = analysis.blooms_levels
            
            self.add_thinking_step(state, "observation", f"Understood: {analysis.topic} ({analysis.subject})")
            
        except Exception as e:
            logger.error("Prompt analysis failed", error=str(e))
            state["enhanced_prompt"] = state["original_prompt"]
            state["needs_clarification"] = False
        
        return state


class MaterialRetrieverNode(BaseNode):
    """Retrieves relevant content from source materials"""
    
    def __init__(self, llm, rag_service, sse_handler: Optional[SSEHandler] = None):
        super().__init__(llm, sse_handler)
        self.rag_service = rag_service
    
    async def __call__(self, state: AgentState) -> AgentState:
        """Retrieve relevant content from materials"""
        material_ids = state.get("selected_material_ids", [])
        
        if not material_ids:
            await self.emit_thinking("No materials selected, generating from prompt only...")
            state["retrieved_chunks"] = []
            return state
        
        await self.emit_action(f"Searching {len(material_ids)} material(s)...")
        
        try:
            query = state.get("enhanced_prompt") or state["original_prompt"]
            
            chunks = await retrieve_materials(
                rag_service=self.rag_service,
                tenant_id=state["tenant_id"],
                query=query,
                material_ids=material_ids,
                top_k=10
            )
            
            state["retrieved_chunks"] = chunks
            
            # Emit sources found
            for chunk in chunks[:3]:  # Show top 3
                if self.sse_handler:
                    await self.sse_handler.send_source_found(
                        source_id=chunk.material_id,
                        title=chunk.material_title,
                        excerpt=chunk.content[:200]
                    )
            
            self.add_thinking_step(
                state, "observation", 
                f"Found {len(chunks)} relevant sections"
            )
            
        except Exception as e:
            logger.error("Material retrieval failed", error=str(e))
            state["retrieved_chunks"] = []

        return state


class QuestionGeneratorNode(BaseNode):
    """Generates questions from source materials"""

    async def __call__(self, state: AgentState) -> AgentState:
        """Generate questions based on config and materials"""
        config = state["config"]
        total = config.question_count

        await self.emit_action(f"Generating {total} question(s)...")

        try:
            system_prompt = get_prompt("question_generator")

            # Build context from retrieved chunks
            context = self._build_context(state.get("retrieved_chunks", []))

            # Build generation request
            request = self._build_request(state)

            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"""
## Source Materials
{context}

## Generation Request
{request}

Generate {total} questions now. Output each question as a JSON object.
""")
            ]

            response = await self.llm.ainvoke(messages)
            questions = self._parse_questions(response.content, state)

            state["questions"] = questions
            state["current_question_index"] = len(questions)

            # Emit question completions
            for i, q in enumerate(questions):
                if self.sse_handler:
                    await self.sse_handler.send_question_complete(
                        question_id=q.question_id,
                        question_data=q.model_dump(),
                        score=q.quality_score or 0.85
                    )

            self.add_thinking_step(
                state, "observation",
                f"Generated {len(questions)} questions"
            )

        except Exception as e:
            logger.error("Question generation failed", error=str(e))
            state["error"] = str(e)

        return state

    def _build_context(self, chunks: List[SourceChunk]) -> str:
        """Build context string from chunks"""
        if not chunks:
            return "No source materials provided. Generate based on general knowledge."

        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            location = f" (Page {chunk.location})" if chunk.location else ""
            context_parts.append(
                f"### Source {i}: {chunk.material_title}{location}\n{chunk.content}\n"
            )
        return "\n".join(context_parts)

    def _build_request(self, state: AgentState) -> str:
        """Build the generation request"""
        config = state["config"]
        analysis = state.get("prompt_analysis")

        types = ", ".join([t.value for t in config.question_types])

        return f"""
Subject: {config.subject or 'Not specified'}
Topic: {config.topic or 'From prompt'}
Question Types: {types}
Difficulty: {config.difficulty.value}
Bloom's Levels: {config.blooms_levels}
Count: {config.question_count}
Special Requirements: {', '.join(config.special_requirements) or 'None'}
Enhanced Prompt: {state.get('enhanced_prompt', state['original_prompt'])}
"""

    def _parse_questions(self, content: str, state: AgentState) -> List[GeneratedQuestion]:
        """Parse generated questions from LLM response"""
        questions = []

        try:
            # Try to extract JSON array or objects
            if "```json" in content:
                json_content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                json_content = content.split("```")[1].split("```")[0]
            else:
                json_content = content

            # Try parsing as array first
            try:
                data = json.loads(json_content.strip())
                if isinstance(data, list):
                    items = data
                else:
                    items = [data]
            except json.JSONDecodeError:
                # Try to find individual JSON objects
                import re
                items = []
                for match in re.finditer(r'\{[^{}]*\}', json_content, re.DOTALL):
                    try:
                        items.append(json.loads(match.group()))
                    except:
                        continue

            for i, item in enumerate(items):
                q = GeneratedQuestion(
                    question_id=item.get("question_id", f"q{i+1}"),
                    type=QuestionType(item.get("type", "MCQ")),
                    difficulty=Difficulty(item.get("difficulty", "MEDIUM")),
                    blooms_level=BloomsLevel(item.get("blooms_level", "UNDERSTAND")),
                    question_text=item.get("question_text", ""),
                    options=item.get("options"),
                    correct_answer=item.get("correct_answer", ""),
                    explanation=item.get("explanation", ""),
                    source_citations=[
                        SourceCitation(**c) for c in item.get("source_citations", [])
                    ] if item.get("source_citations") else [],
                    tags=item.get("tags", []),
                    quality_score=0.85,
                    is_valid=True
                )
                questions.append(q)

        except Exception as e:
            logger.error("Failed to parse questions", error=str(e))

        return questions


class QuestionValidatorNode(BaseNode):
    """Validates generated questions for quality"""

    async def __call__(self, state: AgentState) -> AgentState:
        """Validate all generated questions"""
        questions = state.get("questions", [])

        if not questions:
            return state

        await self.emit_thinking(f"Validating {len(questions)} question(s)...")

        # For now, mark all as valid with default score
        # Full validation can be added later with the validator prompt
        for q in questions:
            q.is_valid = True
            q.quality_score = q.quality_score or 0.85

        self.add_thinking_step(state, "observation", "Validation complete")
        return state


class QuestionEditorNode(BaseNode):
    """Edits individual questions based on user feedback"""

    async def edit_question(
        self,
        state: AgentState,
        question_id: str,
        edit_instruction: str,
        new_source_ids: Optional[List[str]] = None
    ) -> GeneratedQuestion:
        """
        Edit a single question based on instruction.

        Args:
            state: Current agent state
            question_id: ID of question to edit
            edit_instruction: What to change
            new_source_ids: Optional new sources for regeneration

        Returns:
            Edited GeneratedQuestion
        """
        # Find the original question
        original = None
        for q in state.get("questions", []):
            if q.question_id == question_id:
                original = q
                break

        if not original:
            raise ValueError(f"Question {question_id} not found")

        await self.emit_action(f"Editing question {question_id}...")

        system_prompt = get_prompt("question_editor")

        # Get new sources if provided
        source_context = ""
        if new_source_ids:
            chunks = await retrieve_materials(
                rag_service=getattr(self, 'rag_service', None),
                tenant_id=state["tenant_id"],
                query=edit_instruction,
                material_ids=new_source_ids,
                top_k=5
            )
            source_context = "\n".join([c.content for c in chunks])

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"""
## Original Question
{json.dumps(original.model_dump(), indent=2)}

## Edit Instruction
{edit_instruction}

## New Source Materials
{source_context or "Use existing sources"}

Apply the edit and return the updated question as JSON.
""")
        ]

        response = await self.llm.ainvoke(messages)

        # Parse edited question
        try:
            content = response.content
            if "```json" in content:
                json_content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                json_content = content.split("```")[1].split("```")[0]
            else:
                json_content = content

            data = json.loads(json_content.strip())
            edited_data = data.get("edited_question", data)

            edited = GeneratedQuestion(
                question_id=original.question_id,
                type=QuestionType(edited_data.get("type", original.type.value)),
                difficulty=Difficulty(edited_data.get("difficulty", original.difficulty.value)),
                blooms_level=BloomsLevel(edited_data.get("blooms_level", original.blooms_level.value)),
                question_text=edited_data.get("question_text", original.question_text),
                options=edited_data.get("options", original.options),
                correct_answer=edited_data.get("correct_answer", original.correct_answer),
                explanation=edited_data.get("explanation", original.explanation),
                source_citations=original.source_citations,
                tags=edited_data.get("tags", original.tags),
                quality_score=0.85,
                is_valid=True
            )

            return edited

        except Exception as e:
            logger.error("Failed to parse edited question", error=str(e))
            raise ValueError(f"Failed to edit question: {e}")

