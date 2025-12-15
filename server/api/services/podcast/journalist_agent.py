from typing import Dict, Any, List
import json
from api.unified_ai import generate_ai_content

class JournalistAgent:
    def __init__(self, user):
        self.user = user

    def run(self, concept: Dict[str, Any]) -> Dict[str, Any]:
        """
        Researches the topic using Google Search Grounding to find fresh, relevant info.
        """
        topic = concept.get('topic', 'General Topic')
        angle = concept.get('angle', '')
        
        # 1. Research Prompt
        prompt = f"""
        You are an Investigative Journalist for a podcast.
        Topic: {topic}
        Angle: {angle}
        
        Task:
        Use Google Search to find REAL, RECENT, and INTERESTING facts about this topic.
        Do not invent information. Use the search results provided by the system.
        
        Focus on:
        1. Recent news or developments (2024-2025).
        2. Surprising facts or statistics.
        3. Controversies or debates (if applicable).
        
        Output JSON:
        {{
            "research_dossier": [
                {{
                    "fact": "Summary of the fact",
                    "source": "Source name (if available from grounding)"
                }},
                ... (at least 3 key facts)
            ],
            "vocabulary_ideas": ["List of 5 relevant B1/B2 distinct words related to this"]
        }}
        """
        
        # 2. Call AI with Search Tools
        # Note: The adapter expects 'tools' which maps directly to the API payload
        tools = [{"googleSearchRetrieval": {}}]
        
        # Helper for parsing
        def parse_response(resp):
            text = resp.text.strip()
            if "```" in text:
                import re
                json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
                if json_match:
                    text = json_match.group(1)
                else:
                    text = text.replace("```json", "").replace("```", "").strip()
            try:
                return json.loads(text)
            except:
                import json_repair
                return json_repair.loads(text)

        try:
            response = generate_ai_content(
                user=self.user,
                prompt=prompt,
                max_tokens=2000, 
                json_mode=True,
                tools=tools
            )
            dossier = parse_response(response)
        except Exception as e:
            print(f"JournalistAgent Search failed or parsed failed: {e}. Falling back...")
            # Fallback
            fallback_prompt = prompt.replace("Use Google Search to find", "Use your internal knowledge to list")
            response = generate_ai_content(
                user=self.user,
                prompt=fallback_prompt,
                max_tokens=2000, 
                json_mode=True
            )
            try:
                dossier = parse_response(response)
            except Exception as final_err:
                print(f"Journalist Fallback Parsing Failed: {final_err}")
                return {"research_dossier": [], "vocabulary_ideas": []}
             
        return dossier
