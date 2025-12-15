from typing import Dict, Any, List
import json
from api.unified_ai import generate_ai_content
from api.models import PodcastCategory, Podcast

class ShowrunnerAgent:
    def __init__(self, user):
        self.user = user

    def run(self, category: PodcastCategory, custom_topic: str = None) -> Dict[str, Any]:
        """
        Decides the concept for the next episode based on history and category style.
        """
        # 1. Fetch Context
        # 1. Fetch Context from Real Episodes (Source of Truth)
        recent_episodes = Podcast.objects.filter(category=category).order_by('-created_at')[:5]
        # Reverse to chronological order for the prompt
        recent_episodes = list(reversed(recent_episodes))
        
        history_summary = ""
        if recent_episodes:
            history_summary = "\n".join([f"- Ep {ep.episode_number}: {ep.title} ({ep.summary[:100]}...)" for ep in recent_episodes])
        
        # 2. Construct Prompt
        task_instruction = "Propose a concept for the NEXT episode."
        if custom_topic:
            task_instruction = f"The user has requested a specific topic: '{custom_topic}'. Build the episode around this topic."

        prompt = f"""
        You are the Showrunner for a podcast named "{category.name}".
        Style: {category.style}
        Tone: {category.tone}
        Target Audience: {category.target_audience} Level
        
        Series History (Last 5 episodes):
        {history_summary if history_summary else "No previous episodes. This is the Premiere."}
        
        Task:
        {task_instruction}
        It must be distinct from recent history but fit the series arc.
        
        Output JSON:
        {{
            "topic": "Title of the topic",
            "angle": "The specific angle or question to explore",
            "rationale": "Why this topic now?"
        }}
        """
        
        # 3. Call AI
        response = generate_ai_content(
            user=self.user,
            prompt=prompt,
            max_tokens=1000,
            json_mode=True
        )
        
        # Robust Parsing
        text = response.text.strip()
        
        # Strip markdown syntax if present
        if "```" in text:
            import re
            json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
            if json_match:
                text = json_match.group(1)
            else:
                text = text.replace("```json", "").replace("```", "").strip()

        try:
            concept = json.loads(text)
        except Exception as json_err:
            try:
                import json_repair
                concept = json_repair.loads(text)
            except Exception as repair_err:
                print(f"Showrunner Parsing Failed: {repair_err}")
                print(f"FAILED RAW TEXT: {text[:500]}...")
                # Fallback concept to avoid crash
                return {
                    "topic": "Podcast Episode",
                    "angle": "General discussion",
                    "rationale": "Fallback due to AI error"
                }
             
        # 4. Update Bible (Optimistic update, actual save happens later or here)
        # We return the concept, the caller handles the DB save usually, but let's be thorough.
        return concept

    def update_bible(self, category: PodcastCategory, topic: str):
        bible = category.series_bible or {}
        last_topics = bible.get('last_topics', [])
        last_topics.append(topic)
        bible['last_topics'] = last_topics
        category.series_bible = bible
        category.save()
