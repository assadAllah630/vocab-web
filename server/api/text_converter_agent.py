"""
Multi-Agent Text to Markdown Converter

A sophisticated AI-powered pipeline that converts plain text to rich, 
readable Markdown with multiple processing phases:

1. UNDERSTANDING PHASE: Analyze text structure and intent
2. PLANNING PHASE: Divide into sections and determine processing needs
3. WORKER PHASE: Process each section with specialized workers
4. CRITIQUE PHASE: Review and improve worker outputs
5. COLLECTOR PHASE: Combine all processed sections
6. VALIDATION PHASE: Verify final Markdown is valid

Features:
- Detect and create proper titles/subtitles
- Convert implicit lists to proper Markdown lists
- Detect table-like data and create Markdown tables
- Identify diagram/graph needs and generate Mermaid
- Apply appropriate text formatting (bold, italic, highlight)
- Add contextual emojis where appropriate
- Minimal content changes - only format improvements
"""
import json
import re
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


class ProcessingPhase(Enum):
    UNDERSTANDING = "understanding"
    PLANNING = "planning"
    WORKING = "working"
    CRITIQUE = "critique"
    COLLECTING = "collecting"
    VALIDATING = "validating"


@dataclass
class TextSection:
    """Represents a section of text to be processed."""
    id: int
    content: str
    section_type: str = "paragraph"  # paragraph, list, table, code, diagram
    processed_content: str = ""
    critique_notes: str = ""
    is_approved: bool = False


@dataclass
class ProcessingPlan:
    """Plan for how to process the text."""
    total_sections: int = 0
    sections: List[TextSection] = field(default_factory=list)
    detected_title: str = ""
    detected_structure: str = ""  # article, transcript, report, notes, etc.
    processing_notes: str = ""


@dataclass
class AgentResult:
    """Result from the text converter agent."""
    success: bool
    markdown: str
    title: str = ""
    processing_log: List[str] = field(default_factory=list)
    error: str = ""


class TextConverterAgent:
    """
    Multi-agent system for converting plain text to rich Markdown.
    
    Uses OpenAI-compatible API for AI-powered processing.
    """
    
    # System prompts for each phase
    UNDERSTANDING_PROMPT = """You are a Text Analysis Expert. Analyze the given text and identify:

1. STRUCTURE: What type of document is this? (article, transcript, report, notes, instructions, story, etc.)
2. TITLE: Does it have an existing title? If not, suggest one based on content.
3. SECTIONS: How many logical sections/paragraphs should it have?
4. SPECIAL ELEMENTS: Identify any:
   - Lists (numbered or bullet, even if not clearly formatted)
   - Tables (data that should be in table format)
   - Diagrams (concepts that could be visualized as flowcharts, etc.)
   - Code snippets
   - Quotes or highlighted text
5. FORMATTING NEEDS: What text needs emphasis (bold, italic)?
6. EMOJI OPPORTUNITIES: Where would emojis enhance readability?

Respond in JSON format:
{
    "document_type": "...",
    "suggested_title": "...",
    "existing_title": "..." or null,
    "section_count": N,
    "special_elements": {
        "lists": [...],
        "tables": [...],
        "diagrams": [...],
        "quotes": [...]
    },
    "formatting_hints": [...],
    "emoji_suggestions": [...]
}"""

    PLANNING_PROMPT = """You are a Document Structure Planner. Based on the analysis, divide this text into logical sections.

For each section, specify:
1. Section type (paragraph, list, table, diagram, quote, code)
2. Where it starts and ends in the original text
3. Any special processing needed

Respond in JSON format:
{
    "sections": [
        {
            "id": 1,
            "type": "paragraph|list|table|diagram|quote|code",
            "start_marker": "first few words...",
            "end_marker": "last few words...",
            "processing_notes": "..."
        }
    ]
}"""

    WORKER_PROMPT = """You are a Markdown Formatting Expert. Convert this text section to clean Markdown.

RULES:
1. DO NOT change the meaning or remove content
2. ONLY improve formatting and structure
3. Apply appropriate Markdown:
   - Headers (## for subtitles)
   - Lists (- or 1. 2. 3.)
   - Tables (| header | header |)
   - Bold (**text**) for emphasis
   - Italic (*text*) for terms/names
   - Code blocks (```) for code
   - Blockquotes (>) for quotes
   - Add relevant emojis where natural
4. If diagram is needed, create Mermaid syntax

Section type: {section_type}
Processing notes: {notes}

OUTPUT ONLY THE FORMATTED MARKDOWN, nothing else."""

    CRITIQUE_PROMPT = """You are a Quality Reviewer. Review this Markdown section for:

1. Is the formatting correct and valid?
2. Does it preserve all original content?
3. Is the structure logical and readable?
4. Are emojis used appropriately (not excessive)?
5. Would a reader find this easy to read?

If issues found, provide specific corrections.
If approved, respond with: {"approved": true}

Otherwise respond with:
{
    "approved": false,
    "issues": ["issue1", "issue2"],
    "suggested_fix": "corrected markdown here"
}"""

    MD_VALIDATION_PROMPT = """You are a Markdown Validator. Check this complete Markdown for:

1. Valid syntax (all tags closed, proper nesting)
2. Consistent heading hierarchy
3. Proper list formatting
4. Valid table syntax
5. Valid Mermaid diagram syntax (if any)
6. No broken links or references

If valid, respond: {"valid": true}
If issues, respond: {"valid": false, "issues": [...], "fixed_markdown": "..."}"""

    def __init__(self, user, model: str = "gpt-4o-mini"):
        """
        Initialize the agent with a user (for AI Gateway access).
        
        Args:
            user: Django User object
            model: Model key (used for logging or specific provider selection if needed)
        """
        self.user = user
        self.model = model
        self.client = None # Deprecated, using UnifiedAI
        self.processing_log: List[str] = []
    
    def convert(self, text: str, source_type: str = "unknown") -> AgentResult:
        """
        Convert plain text to rich Markdown using multi-phase processing.
        
        Args:
            text: Plain text to convert
            source_type: Type of source (article, youtube, pdf, etc.)
            
        Returns:
            AgentResult with processed Markdown
        """
        self.processing_log = []
        
        try:
            # Phase 1: Understanding
            self._log(f"📊 Phase 1: Understanding text structure...")
            understanding = self._understand_text(text, source_type)
            
            # Phase 2: Planning
            self._log(f"📋 Phase 2: Planning section divisions...")
            plan = self._plan_processing(text, understanding)
            
            # Phase 3: Working (process each section)
            self._log(f"⚙️ Phase 3: Processing {len(plan.sections)} sections...")
            for section in plan.sections:
                self._process_section(section)
            
            # Phase 4: Critique (review each section)
            self._log(f"🔍 Phase 4: Critiquing outputs...")
            for section in plan.sections:
                self._critique_section(section)
            
            # Phase 5: Collect
            self._log(f"📦 Phase 5: Collecting results...")
            combined = self._collect_results(plan)
            
            # Phase 6: Validate
            self._log(f"✅ Phase 6: Validating Markdown...")
            final_md = self._validate_markdown(combined, plan)
            
            self._log(f"🎉 Conversion complete!")
            
            return AgentResult(
                success=True,
                markdown=final_md,
                title=plan.detected_title,
                processing_log=self.processing_log
            )
            
        except Exception as e:
            logger.exception(f"Agent conversion failed: {e}")
            self._log(f"❌ Error: {str(e)}")
            
            # Fallback to simple formatting
            fallback_md = self._simple_fallback(text)
            
            return AgentResult(
                success=False,
                markdown=fallback_md,
                error=str(e),
                processing_log=self.processing_log
            )
    
    def _log(self, message: str):
        """Add to processing log."""
        self.processing_log.append(message)
        logger.info(message)
    
    def _call_ai(self, system: str, user_prompt: str, json_mode: bool = False, quality_tier: str = None) -> str:
        """Make AI API call via Unified AI Gateway."""
        try:
            from api.unified_ai import generate_ai_content
            
            # Combine system and user prompts
            full_prompt = f"{system}\n\n{user_prompt}"
            
            # Call Unified AI
            # Note: Max tokens adjusted for Gateway
            capabilities = []
            
            if json_mode:
                capabilities.append('json_mode')
                if not quality_tier:
                    quality_tier = 'high'  # Require high quality for JSON tasks
            
            response = generate_ai_content(
                user=self.user,
                prompt=full_prompt,
                max_tokens=4000, 
                temperature=0.3,
                required_capabilities=capabilities,
                quality_tier=quality_tier
            )
            
            response_text = response.text
            
            if json_mode:
                # Cleanup Markdown code blocks if present
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0].strip()
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0].strip()
            
            return response_text
            
        except Exception as e:
            logger.error(f"AI call failed: {e}")
            raise

    def _understand_text(self, text: str, source_type: str) -> Dict[str, Any]:
        """Phase 1: Understand the text structure."""
        prompt = f"""Analyze this {source_type} text:

---
{text[:8000]}
---

Identify structure, formatting needs, and special elements."""

        response = self._call_ai(self.UNDERSTANDING_PROMPT, prompt, json_mode=True)
        
        try:
            understanding = json.loads(response)
            self._log(f"   → Document type: {understanding.get('document_type', 'unknown')}")
            self._log(f"   → Sections: {understanding.get('section_count', 'unknown')}")
            return understanding
        except json.JSONDecodeError:
            return {"document_type": source_type, "section_count": 5}

    def _plan_processing(self, text: str, understanding: Dict) -> ProcessingPlan:
        """Phase 2: Plan how to divide and process the text."""
        prompt = f"""Based on this analysis:
{json.dumps(understanding, indent=2)}

Plan how to divide this text into sections:
---
{text[:8000]}
---"""

        response = self._call_ai(self.PLANNING_PROMPT, prompt, json_mode=True)
        
        plan = ProcessingPlan()
        
        try:
            plan_data = json.loads(response)
            sections_data = plan_data.get('sections', [])
            
            # Create sections from the plan
            for i, sec_data in enumerate(sections_data):
                section = TextSection(
                    id=i + 1,
                    content=self._extract_section_content(text, sec_data),
                    section_type=sec_data.get('type', 'paragraph')
                )
                plan.sections.append(section)
            
            # If no sections were planned, divide by paragraph
            if not plan.sections:
                plan.sections = self._divide_by_paragraphs(text)
            
            plan.total_sections = len(plan.sections)
            plan.detected_title = understanding.get('suggested_title') or understanding.get('existing_title', '')
            plan.detected_structure = understanding.get('document_type', 'unknown')
            
            self._log(f"   → Planned {plan.total_sections} sections")
            
        except json.JSONDecodeError:
            plan.sections = self._divide_by_paragraphs(text)
            plan.total_sections = len(plan.sections)
        
        return plan

    def _extract_section_content(self, text: str, section_data: Dict) -> str:
        """Extract section content based on markers."""
        start = section_data.get('start_marker', '')
        end = section_data.get('end_marker', '')
        
        if start and end:
            start_idx = text.find(start)
            end_idx = text.find(end)
            
            if start_idx >= 0 and end_idx >= 0:
                return text[start_idx:end_idx + len(end)]
        
        # Fallback: return segment based on section ID
        return text

    def _divide_by_paragraphs(self, text: str, max_sections: int = 10) -> List[TextSection]:
        """Divide text into sections by paragraphs."""
        paragraphs = re.split(r'\n\s*\n', text.strip())
        paragraphs = [p.strip() for p in paragraphs if p.strip()]
        
        # Combine very short paragraphs
        combined = []
        current = []
        word_count = 0
        
        for para in paragraphs:
            current.append(para)
            word_count += len(para.split())
            
            if word_count >= 100 or len(current) >= 3:
                combined.append('\n\n'.join(current))
                current = []
                word_count = 0
        
        if current:
            combined.append('\n\n'.join(current))
        
        # Limit sections
        if len(combined) > max_sections:
            # Merge into max_sections
            chunk_size = len(combined) // max_sections + 1
            merged = []
            for i in range(0, len(combined), chunk_size):
                merged.append('\n\n'.join(combined[i:i+chunk_size]))
            combined = merged[:max_sections]
        
        return [
            TextSection(id=i+1, content=content, section_type="paragraph")
            for i, content in enumerate(combined)
        ]

    def _process_section(self, section: TextSection):
        """Phase 3: Process a single section with worker agent."""
        prompt = f"""Convert this section to Markdown:

---
{section.content}
---"""

        worker_prompt = self.WORKER_PROMPT.format(
            section_type=section.section_type,
            notes=""
        )
        
        try:
            # Use high quality tier for better formatting
            content = self._call_ai(worker_prompt, prompt, quality_tier='high')
            
            # Cleanup Markdown code blocks if present (common with OpenRouter/Gemini)
            if "```markdown" in content:
                content = content.split("```markdown")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
                
            section.processed_content = content
            self._log(f"   → Section {section.id} processed")
        except Exception as e:
            # Fallback: keep original with minimal formatting
            section.processed_content = section.content
            self._log(f"   → Section {section.id} fallback (error: {e})")

    def _critique_section(self, section: TextSection):
        """Phase 4: Critique and potentially improve section."""
        prompt = f"""Review this Markdown section:

ORIGINAL:
{section.content[:1000]}

FORMATTED:
{section.processed_content[:2000]}"""

        try:
            response = self._call_ai(self.CRITIQUE_PROMPT, prompt, json_mode=True)
            critique = json.loads(response)
            
            if critique.get('approved', False):
                section.is_approved = True
            else:
                # Apply suggested fix if provided
                if critique.get('suggested_fix'):
                    section.processed_content = critique['suggested_fix']
                section.critique_notes = str(critique.get('issues', []))
                section.is_approved = True  # Accept after revision
            
        except Exception as e:
            section.is_approved = True  # Accept original on error
            self._log(f"   → Section {section.id} critique skipped: {e}")

    def _collect_results(self, plan: ProcessingPlan) -> str:
        """Phase 5: Combine all processed sections."""
        parts = []
        
        # Add title if detected
        if plan.detected_title:
            parts.append(f"# {plan.detected_title}\n")
        
        # Add all sections
        for section in plan.sections:
            content = section.processed_content or section.content
            parts.append(content)
        
        return '\n\n'.join(parts)

    def _validate_markdown(self, markdown: str, plan: ProcessingPlan) -> str:
        """Phase 6: Validate and fix final Markdown."""
        prompt = f"""Validate this Markdown document:

---
{markdown[:10000]}
---"""

        try:
            response = self._call_ai(self.MD_VALIDATION_PROMPT, prompt, json_mode=True)
            validation = json.loads(response)
            
            if validation.get('valid', True):
                self._log(f"   → Markdown validated successfully")
                return markdown
            else:
                issues = validation.get('issues', [])
                self._log(f"   → Found issues: {issues}")
                
                if validation.get('fixed_markdown'):
                    return validation['fixed_markdown']
                
        except Exception as e:
            self._log(f"   → Validation skipped: {e}")
        
        return markdown

    def _simple_fallback(self, text: str) -> str:
        """Simple fallback formatting without AI."""
        lines = text.strip().split('\n')
        result = []
        
        for line in lines:
            line = line.strip()
            if not line:
                result.append('')
                continue
            
            # Detect potential titles
            if len(line.split()) <= 8 and (line.isupper() or line.istitle()):
                result.append(f"## {line}")
            # Detect numbered lists
            elif re.match(r'^\d+[\.\)]\s', line):
                result.append(re.sub(r'^(\d+)[\.\)]\s', r'\1. ', line))
            # Detect bullet points
            elif line.startswith(('-', '*', '•')):
                result.append(f"- {line[1:].strip()}")
            else:
                result.append(line)
        
        return '\n'.join(result)


# Convenience function
def convert_text_to_markdown(text: str, user, source_type: str = "unknown", model: str = "gpt-4o-mini") -> AgentResult:
    """
    Convert plain text to rich Markdown using the multi-agent converter.
    
    Args:
        text: Plain text to convert
        user: Django User object (for AI Gateway)
        source_type: Type of source content
        model: AI model to use
        
    Returns:
        AgentResult with processed Markdown
    """
    agent = TextConverterAgent(user, model)
    return agent.convert(text, source_type)
