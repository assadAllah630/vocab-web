from typing import TypedDict, List, Dict, Any, Optional
import json
from langgraph.graph import StateGraph, END
from api.unified_ai import generate_ai_content

class VocabState(TypedDict):
    topic: str
    level: str
    target_language: str
    count: int
    user_object: Any
    final_list: List[Dict[str, str]]
    logs: List[str]

def generator_node(state: VocabState) -> VocabState:
    """Generate a structured vocabulary list based on the topic."""
    
    prompt = f"""Generate a vocabulary list for a {state['level']} learner of {state['target_language']}.
    
Topic: "{state['topic']}"
Count: {state['count']} words

Output a JSON array of objects. Each object must have:
- "word": The word in {state['target_language']}
- "translation": English translation
- "definition": Simple definition in {state['target_language']}
- "context": A simple example sentence in {state['target_language']}

Example Format:
[
  {{ "word": "Flughafen", "translation": "Airport", "definition": "Ein Ort wo Flugzeuge...", "context": "Wir fahren zum Flughafen." }}
]

Ensure words are relevant, strictly at the {state['level']} level, and useful.
Respond ONLY with valid JSON.
"""
    try:
        response = generate_ai_content(
            user=state.get('user_object'),
            prompt=prompt,
            quality_tier='high', # Better models for correct definitions
            json_mode=True
        )
        
        cleaned_text = response.text.strip()
        if cleaned_text.startswith('```json'):
            cleaned_text = cleaned_text[7:-3]
            
        vocab_list = json.loads(cleaned_text)
        
        return {"final_list": vocab_list, "logs": ["Generated list."]}
        
    except Exception as e:
        print(f"Vocab gen failed: {e}")
        return {
            "final_list": [], 
            "logs": [f"Error: {str(e)}"]
        }

# Graph Construction
workflow = StateGraph(VocabState)
workflow.add_node("generate", generator_node)
workflow.set_entry_point("generate")
workflow.add_edge("generate", END)

vocab_agent = workflow.compile()

def run_vocabulary_agent(user, topic: str, level: str = 'B1', target_language: str = 'German', count: int = 10):
    """Entry point for generating vocab lists."""
    initial_state = {
        "topic": topic,
        "level": level,
        "target_language": target_language,
        "count": count,
        "user_object": user,
        "final_list": [],
        "logs": []
    }
    
    result = vocab_agent.invoke(initial_state)
    return result['final_list']
