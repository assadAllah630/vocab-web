from typing import Dict, Any, List
import json
from api.unified_ai import generate_ai_content

class WriterAgent:
    def __init__(self, user):
        self.user = user

    def run(self, concept: Dict[str, Any], research: Dict[str, Any], category_style: str, target_language: str = 'en', target_level: str = 'B1') -> Dict[str, Any]:
        """
        Writes the script.
        """
        # Unpack inputs
        # Unpack inputs
        topic = concept.get('topic') if isinstance(concept, dict) else "Podcast Topic"
        angle = concept.get('angle', '') if isinstance(concept, dict) else ""
        
        facts = research.get('research_dossier', []) if isinstance(research, dict) else []
        facts_text = ""
        
        # Robustly handle facts (could be list of dicts, strings, or mixed)
        if isinstance(facts, list):
            for f in facts:
                if isinstance(f, dict):
                    facts_text += f"- {f.get('fact', '')} (Source: {f.get('source', '')})\n"
                elif isinstance(f, str):
                    facts_text += f"- {f}\n"
        elif isinstance(facts, str):
            facts_text = facts
        
        prompt = f"""
        You are the Head Writer for a podcast.
        Style: {category_style}
        Target Language: {target_language} (The script MUST be spoken in this language)
        Target Level: {target_level} (Adjust vocabulary and grammar complexity to this CEFR level)
        Topic: {topic}
        Angle: {angle}
        
        Research Material:
        {facts_text}
        
        Task:
        Write a lively, engaging 2-speaker script (Host A and Host B).
        
        Guidelines:
        1. **Start with a Hook**: Jump right into the interesting part.
        2. **Banter**: Use natural interruptions, laughs, and casual language.
        3. **Level Matching**: strict adherence to {target_level} vocabulary. Unnecessary complex words should be avoided if Level is A1/A2. 
        4. **Structure**: Intro -> Discussion -> "Deep Dive" -> Conclusion.
        5. **Length**: Aim for about 3-5 minutes of dialogue (approx 500-750 words).
        
        Format JSON:
        {{
            "title": "final catchy title",
            "summary": "1 sentence summary for the next episode's context",
            "script": [
                {{
                    "speaker": "Host A",
                    "text": "..."
                }},
                {{
                    "speaker": "Host B",
                    "text": "..."
                }},
                ...
            ]
        }}
        """
        
        response = generate_ai_content(
            user=self.user,
            prompt=prompt,
            max_tokens=4000,
            json_mode=True
        )
        
        # Robust Parsing
        text = response.text.strip()
        
        # Strip markdown syntax if present
        if "```" in text:
            # Try to find JSON block
            import re
            json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
            if json_match:
                text = json_match.group(1)
            else:
                # Basic strip
                text = text.replace("```json", "").replace("```", "").strip()

        try:
            script_data = json.loads(text)
        except Exception as json_err:
            print(f"Standard JSON parse failed: {json_err}")
            try:
                import json_repair
                script_data = json_repair.loads(text)
            except Exception as repair_err:
                print(f"JSON Repair failed: {repair_err}")
                print(f"FAILED RAW TEXT: {text[:500]}...")
                # Return basic structure to avoid crash, but log error
                return {
                    "title": "Error generating script",
                    "summary": "AI output could not be parsed.",
                    "script": [{"speaker": "System", "text": "Error: " + str(repair_err)}] 
                }
             
        return script_data
