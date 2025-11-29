import google.generativeai as genai
import json
import re
import logging

logger = logging.getLogger(__name__)

class GrammarResearchAgent:
    """
    Agent for researching and generating grammar explanations.
    Uses Google Gemini to synthesize information from authoritative sources.
    """
    
    def __init__(self, api_key):
        self.api_key = api_key
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        
    def generate_grammar_topic(self, topic, language, level, context_note=""):
        """
        Main entry point to generate a grammar topic.
        """
        try:
            # Stage 1 & 2: Research & Analysis (Simulated via LLM knowledge)
            # Stage 3: Content Generation
            content = self._generate_content(topic, language, level, context_note)
            
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

    def _generate_content(self, topic, language, level, context_note):
        """
        Generates the content using Gemini.
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
2. Write a concise, accurate explanation in Markdown format
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

**Output Format**:
Return ONLY a raw JSON object (no markdown code blocks) with the following structure:
{{
  "title": "The Grammar Topic Title",
  "content": "The full explanation in Markdown format (ensure all quotes are escaped)",
  "word_count": 450,
  "mermaid_diagrams_count": 1,
  "estimated_read_time": "3 min",
  "sources": [
    {{"name": "Source Name", "url": "URL if known, else base domain"}}
  ],
  "related_topics": ["Topic 1", "Topic 2"],
  "tags": ["tag1", "tag2"]
}}
"""

        # Use JSON mode for reliable output
        generation_config = {"response_mime_type": "application/json"}
        response = self.model.generate_content(
            f"{system_prompt}\n\n{user_prompt}",
            generation_config=generation_config
        )
        
        # Parse JSON from response
        text = response.text.strip()
        logger.info(f"DEBUG: Raw Grammar Agent Response:\n{text}")
        
        # Robust JSON extraction
        try:
            # Try direct parse first
            return json.loads(text)
        except json.JSONDecodeError:
            # Try to find JSON object bounds
            try:
                start = text.find('{')
                end = text.rfind('}') + 1
                if start != -1 and end != -1:
                    json_str = text[start:end]
                    return json.loads(json_str)
            except:
                pass
            # Re-raise original error if fallback fails
            raise
