"""
LaTeX Converter Tool

Converts mathematical expressions to proper LaTeX format.
"""

from typing import Optional
import re
import structlog
from langchain.tools import BaseTool
from pydantic import BaseModel, Field

logger = structlog.get_logger()


class LatexConverterInput(BaseModel):
    """Input schema for LaTeX converter"""
    text: str = Field(description="Text containing mathematical expressions to convert")


class LatexConverterTool(BaseTool):
    """
    Tool for converting mathematical expressions to LaTeX.
    
    Identifies mathematical content and wraps it in appropriate
    LaTeX delimiters for rendering.
    """
    
    name: str = "latex_converter"
    description: str = """
    Converts mathematical expressions in text to proper LaTeX format.
    Use this when generating questions with mathematical content.
    """
    args_schema: type[BaseModel] = LatexConverterInput
    
    def _run(self, text: str) -> str:
        """Convert mathematical expressions to LaTeX"""
        return self._convert_to_latex(text)
    
    async def _arun(self, text: str) -> str:
        """Async version of LaTeX conversion"""
        return self._convert_to_latex(text)
    
    def _convert_to_latex(self, text: str) -> str:
        """
        Convert mathematical expressions to LaTeX format.
        
        This handles common patterns and ensures proper formatting.
        """
        # Already has LaTeX delimiters - return as is
        if '$' in text:
            return text
        
        result = text
        
        # Pattern replacements for common mathematical expressions
        patterns = [
            # Fractions: a/b -> \frac{a}{b}
            (r'(\d+)/(\d+)', r'$\\frac{\1}{\2}$'),
            
            # Exponents: x^2, x^n -> $x^2$, $x^n$
            (r'(\w)\^(\d+|\w)', r'$\1^{\2}$'),
            
            # Square roots: sqrt(x) -> $\sqrt{x}$
            (r'sqrt\(([^)]+)\)', r'$\\sqrt{\1}$'),
            
            # Common constants
            (r'\bpi\b', r'$\\pi$'),
            (r'\btheta\b', r'$\\theta$'),
            (r'\balpha\b', r'$\\alpha$'),
            (r'\bbeta\b', r'$\\beta$'),
            
            # Inequalities
            (r'<=', r'$\\leq$'),
            (r'>=', r'$\\geq$'),
            (r'!=', r'$\\neq$'),
            
            # Common functions
            (r'\bsin\b', r'$\\sin$'),
            (r'\bcos\b', r'$\\cos$'),
            (r'\btan\b', r'$\\tan$'),
            (r'\blog\b', r'$\\log$'),
            (r'\bln\b', r'$\\ln$'),
        ]
        
        for pattern, replacement in patterns:
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
        
        # Merge adjacent LaTeX expressions
        result = re.sub(r'\$\s*\$', '', result)
        
        return result


def ensure_latex_format(text: str) -> str:
    """
    Convenience function to ensure text has proper LaTeX formatting.
    
    Args:
        text: Text that may contain mathematical expressions
        
    Returns:
        Text with mathematical expressions in LaTeX format
    """
    tool = LatexConverterTool()
    return tool._run(text)


def wrap_display_math(expression: str) -> str:
    """
    Wrap an expression as display math (centered, own line).
    
    Args:
        expression: Mathematical expression (without delimiters)
        
    Returns:
        Expression wrapped in $$...$$ delimiters
    """
    # Remove existing delimiters if present
    expression = expression.strip().strip('$')
    return f"$$\n{expression}\n$$"


def wrap_inline_math(expression: str) -> str:
    """
    Wrap an expression as inline math.
    
    Args:
        expression: Mathematical expression (without delimiters)
        
    Returns:
        Expression wrapped in $...$ delimiters
    """
    # Remove existing delimiters if present
    expression = expression.strip().strip('$')
    return f"${expression}$"

