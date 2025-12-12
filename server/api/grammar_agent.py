import json
import re
import logging
from .gemini_helper import get_model
from .language_service import LanguageService

logger = logging.getLogger(__name__)

class GrammarResearchAgent:
    """
    Agent for researching and generating grammar explanations.
    Uses Google Gemini with automatic model fallback.
    """
    
    def __init__(self, api_key):
        self.api_key = api_key
        self.model, self.model_name = get_model(api_key)
        logger.info(f"[GrammarAgent] Using model: {self.model_name}")
        
    def generate_grammar_topic(self, topic, language, level, context_note="", native_language="en"):
        """
        Main entry point to generate a grammar topic.
        
        Args:
            topic: Grammar topic to explain
            language: Target language being learned
            level: CEFR level
            context_note: Additional context
            native_language: User's native language for translations
        """
        try:
            # Get native language name for prompts
            native_lang_name = LanguageService.get_name(native_language)
            
            # Stage 1 & 2: Research & Analysis (Simulated via LLM knowledge)
            # Stage 3: Content Generation
            content = self._generate_content(topic, language, level, context_note, native_lang_name)
            
            # Stage 4: Quality Assurance (Self-Correction)
            # In a more advanced version, we would have a separate verification step.
            # For now, we rely on the strong system prompt and single-shot generation.
            
            return {
                "success": True,
                "data": content
            }
            
        except Exception as e:
            logger.error(f"Error generating grammar topic: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    def _generate_content(self, topic, language, level, context_note, native_lang_name="English"):
        """
        Generates the content using Gemini with retry logic and robust JSON parsing.
        """
        
        system_prompt = """
You are an expert Grammar Research and Writing Agent specialized in creating authoritative, concise, and pedagogically effective grammar explanations for language learners.

Your capabilities:
1. Research grammar from authoritative sources (Deutsche Welle, Goethe Institut, Cambridge, etc.)
2. Synthesize information from multiple resources
3. Write clear, concise explanations
4. Create visual diagrams using Mermaid syntax
5. Format content in professional Markdown
6. Adapt complexity to student level (A1-C2)

Your principles:
- ACCURACY over creativity (verify facts)
- CONCISENESS over verbosity (less words, more value)
- CLARITY over complexity (simple language)
- VISUAL over text-heavy (use diagrams)
- AUTHORITATIVE over speculative (cite sources)
"""

        user_prompt = f"""
Create a comprehensive grammar explanation with the following parameters:

**Grammar Topic**: {topic}
**Language**: {language}
**CEFR Level**: {level}
**Additional Context**: {context_note}

**Requirements**:
1. Research this topic from authoritative sources (Deutsche Welle, Goethe Institut, Cambridge, etc.)
2. Write a concise, accurate explanation in Markdown format. IMPORTANT: The explanation MUST be in **{native_lang_name}**, but keep grammar terms (like 'Akkusativ', 'Dativ') and examples in **{language}**.
3. Include at least ONE Mermaid diagram to visualize complex structures. IMPORTANT:
   - Use `graph LR` or `graph TD`
   - ALWAYS quote node labels: `id["Label Text"]`
   - Do NOT use special characters in node IDs (only A-Z, 0-9)
   - Keep node labels SHORT (max 3-4 words). Use `<br/>` for line breaks.
   - Use rectangular nodes `[]` for longer text, avoid diamonds for long text.
   - Keep diagrams simple and readable
4. Provide 4-6 clear examples with translations
5. Highlight common mistakes with ❌ and ✅
6. Keep total word count under 600 words (concise!)
7. Use proper Markdown hierarchy (H1, H2, H3)
8. Add practice tips at the end
9. List related grammar topics
10. Cite sources used

**Structure your response as**:
- Overview (2-3 sentences)
- When to Use
- Formation/Rules
- Examples (with translations)
- Visual Representation (Mermaid diagram)
- Common Mistakes (❌ vs ✅)
- Practice Tips
- Related Topics
- Sources

**CRITICAL - Output Format**:
You MUST return ONLY a valid JSON object. NO markdown code blocks, NO explanations, JUST the raw JSON.

IMPORTANT JSON RULES:
1. All strings must use double quotes ("), NOT single quotes (')
2. Escape all special characters in strings: backslash (\\), quotes (\"), newlines (\\n)
3. No trailing commas after the last item in arrays or objects
4. All property names must be in double quotes
5. No comments allowed in JSON

The JSON structure:
{{
  "title": "The Grammar Topic Title",
  "content": "The full explanation in Markdown format (escape all special characters)",
  "category": "verbs",
  "examples": [
    {{"target": "Example sentence in {language}", "translation": "{native_lang_name} translation"}}
  ],
  "word_count": 450,
  "mermaid_diagrams_count": 1,
  "estimated_read_time": "3 min",
  "sources": [
    {{"name": "Source Name", "url": "URL if known, else base domain"}}
  ],
  "related_topics": ["Topic 1", "Topic 2"],
  "tags": ["tag1", "tag2"]
}}

Valid category values: articles, plurals, verbs, separable_verbs, modal_verbs, cases, prepositions, sentence_structure, word_order, time_expressions, adjective_endings, comparatives
"""

        # Retry logic: Try up to 3 times
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Use JSON mode for reliable output
                generation_config = {
                    "response_mime_type": "application/json",
                    "temperature": 0.7 if attempt == 0 else 0.5  # Lower temperature on retry
                }
                
                response = self.model.generate_content(
                    f"{system_prompt}\n\n{user_prompt}",
                    generation_config=generation_config
                )
                
                # Parse JSON from response
                text = response.text.strip()
                logger.info(f"Attempt {attempt + 1}: Raw response length: {len(text)}")
                
                # Multi-strategy JSON extraction
                parsed_json = self._extract_json(text)
                
                # Validate required fields
                required_fields = ['title', 'content', 'category']
                missing = [f for f in required_fields if f not in parsed_json]
                if missing:
                    raise ValueError(f"Missing required fields: {missing}")
                
                logger.info(f"Successfully parsed JSON on attempt {attempt + 1}")
                return parsed_json
                
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed: {str(e)}")
                if attempt == max_retries - 1:
                    # Last attempt failed
                    raise Exception(f"Failed to generate valid content after {max_retries} attempts. Last error: {str(e)}")
                # Wait a bit before retry
                import time
                time.sleep(0.5)

    def _extract_json(self, text):
        """
        Multi-strategy JSON extraction with automatic cleaning.
        """
        # Strategy 1: Direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        # Strategy 2: Remove markdown code blocks
        cleaned = re.sub(r'```json\s*|\s*```', '', text, flags=re.IGNORECASE)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass
        
        # Strategy 3: Find JSON object bounds
        try:
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end > start:
                json_str = text[start:end]
                
                # Clean common issues
                json_str = self._clean_json_string(json_str)
                
                return json.loads(json_str)
        except json.JSONDecodeError:
            pass
        
        # Strategy 4: Try to fix common JSON errors
        try:
            # Remove trailing commas
            fixed = re.sub(r',(\s*[}\]])', r'\1', cleaned)
            # Fix single quotes to double quotes (risky but last resort)
            # Only if not already inside a string
            fixed = re.sub(r"'([^']*)':", r'"\1":', fixed)
            return json.loads(fixed)
        except:
            pass
        
        # All strategies failed
        raise json.JSONDecodeError("Could not extract valid JSON from response", text, 0)
    
    def _clean_json_string(self, json_str):
        """
        Clean common JSON formatting issues.
        """
        # Remove trailing commas before closing braces/brackets
        json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
        
        # Remove any BOM or invisible characters
        json_str = json_str.replace('\ufeff', '')
        
        return json_str.strip()
