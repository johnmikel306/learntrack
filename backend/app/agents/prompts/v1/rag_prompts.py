"""
RAG Agent Prompts

Prompts for the self-corrective RAG agent pipeline.
"""

# Query Analyzer Prompt
QUERY_ANALYZER_PROMPT = """You are a query analyzer for an educational RAG system.
Analyze the following query and identify:
1. The main intent (factual, conceptual, procedural, comparative)
2. Key concepts and terms to search for
3. Expected answer type (text, list, explanation, code)
4. Query complexity (simple, medium, complex)

Query: {query}

Provide your analysis in a structured format:
Intent: [intent]
Key Concepts: [concept1, concept2, ...]
Answer Type: [type]
Complexity: [level]
"""

# Relevance Grader Prompt
RELEVANCE_GRADER_PROMPT = """You are a relevance grader for a RAG system.
Your task is to determine if a document is relevant to answering a query.

Query: {query}

Document:
{document}

Is this document relevant to answering the query? Consider:
- Does it contain information that helps answer the query?
- Is the content topically related?
- Would this document be useful as a source?

Answer with just "yes" or "no" followed by a brief explanation.
"""

# Query Rewriter Prompt
QUERY_REWRITER_PROMPT = """You are a query rewriter for a RAG system.
The original query did not retrieve relevant documents. Rewrite it to improve retrieval.

Original Query: {original_query}
Current Query: {current_query}
Attempt Number: {attempt}

Strategies to try:
1. Use synonyms or alternative terms
2. Make the query more specific or more general
3. Focus on key concepts
4. Rephrase as a different type of question

Provide ONLY the rewritten query, nothing else.
"""

# Answer Generator Prompt
ANSWER_GENERATOR_PROMPT = """You are an educational assistant answering questions based on provided reference materials.

Question: {query}

Reference Materials:
{context}

Instructions:
1. Answer the question based ONLY on the provided reference materials
2. If the materials don't contain enough information, say so clearly
3. Cite sources when making specific claims
4. Use clear, educational language appropriate for students
5. Structure your answer logically

Provide a comprehensive answer:
"""

# Hallucination Checker Prompt
HALLUCINATION_CHECKER_PROMPT = """You are a fact-checker for a RAG system.
Your task is to verify if an answer is grounded in the provided source documents.

Answer to verify:
{answer}

Source Documents:
{context}

Check if:
1. All claims in the answer are supported by the source documents
2. No information is fabricated or hallucinated
3. The answer accurately represents the source content

Does this answer contain hallucinations (unsupported claims)?
Answer "yes" if there are hallucinations, "no" if the answer is fully grounded.
Explain your reasoning briefly.
"""

# Simple RAG Query Prompt (for non-agentic use)
SIMPLE_RAG_QUERY_PROMPT = """Answer the following question based on the provided context.
If the context doesn't contain relevant information, say "I don't have enough information to answer this question."

Context:
{context}

Question: {query}

Answer:
"""

# Document Summary Prompt
DOCUMENT_SUMMARY_PROMPT = """Summarize the following document for use in a RAG system.
Focus on key facts, concepts, and information that would be useful for answering questions.

Document:
{document}

Provide a concise summary (2-3 paragraphs):
"""

# Multi-Document Synthesis Prompt
MULTI_DOCUMENT_SYNTHESIS_PROMPT = """You have multiple document excerpts related to a query.
Synthesize the information into a coherent answer.

Query: {query}

Document Excerpts:
{documents}

Instructions:
1. Identify common themes and complementary information
2. Resolve any contradictions by noting different perspectives
3. Provide a unified answer that draws from all relevant sources
4. Cite which document(s) support each claim

Synthesized Answer:
"""

# Prompt registry for easy access
RAG_PROMPTS = {
    "query_analyzer": QUERY_ANALYZER_PROMPT,
    "relevance_grader": RELEVANCE_GRADER_PROMPT,
    "query_rewriter": QUERY_REWRITER_PROMPT,
    "answer_generator": ANSWER_GENERATOR_PROMPT,
    "hallucination_checker": HALLUCINATION_CHECKER_PROMPT,
    "simple_query": SIMPLE_RAG_QUERY_PROMPT,
    "document_summary": DOCUMENT_SUMMARY_PROMPT,
    "multi_document_synthesis": MULTI_DOCUMENT_SYNTHESIS_PROMPT,
}


def get_rag_prompt(prompt_name: str, **kwargs) -> str:
    """Get a RAG prompt with variables filled in."""
    if prompt_name not in RAG_PROMPTS:
        raise ValueError(f"Unknown RAG prompt: {prompt_name}")
    
    template = RAG_PROMPTS[prompt_name]
    return template.format(**kwargs)

