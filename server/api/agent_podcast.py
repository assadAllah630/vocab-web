import os
from typing import TypedDict, List, Optional, Dict, Any
import json
try:
    import json_repair
except ImportError:
    json_repair = None
from langgraph.graph import StateGraph, END
from .unified_ai import generate_ai_content
from .models import PodcastCategory

# --- Imports ---
from .services.podcast.showrunner_agent import ShowrunnerAgent
from .services.podcast.journalist_agent import JournalistAgent
from .services.podcast.writer_agent import WriterAgent
from .services.podcast.producer_agent import ProducerAgent # Optional if used in graph

# --- State Definition ---
class PodcastState(TypedDict):
    # Inputs
    category_id: int
    user_id: int
    podcast_id: int
    
    # Context (Loaded in Entry Node)
    category_name: str
    style: str
    tone: str
    history_summary: str
    target_language: str
    target_level: str # A1, A2, B1, B2, C1, C2
    audio_speed: float # 0.8 to 1.2
    custom_topic: Optional[str]
    duration_minutes: Optional[int]
    
    # Steps
    concept: Optional[Dict[str, Any]]
    research_dossier: Optional[Dict[str, Any]]
    draft_script: Optional[Dict[str, Any]]
    critique: Optional[str]
    critique_passed: bool
    critique_passed: bool
    revision_count: int
    repair_count: int
    is_valid_structure: bool
    
    # Final Output
    final_script: Optional[Dict[str, Any]]
    audio_files: List[str] # List of paths or status
    logs: List[str]

# --- Helper ---
def call_ai(user_id, prompt: str, max_tokens=2048, json_mode=False, tools=None) -> Any:
    """Helper to call unified_ai with user_id lookup"""
    from django.contrib.auth.models import User
    try:
        user = User.objects.get(id=user_id)
        response = generate_ai_content(
            user, 
            prompt, 
            max_tokens=max_tokens, 
            temperature=0.7, 
            json_mode=json_mode,
            tools=tools
        )
        if json_mode:
            text = response.text.strip()
            # Robust extraction of JSON from markdown
            if "```" in text:
                import re
                json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
                if json_match:
                    text = json_match.group(1)
                else:
                    text = text.replace('```json', '').replace('```', '').strip()
            
            try:
                if json_repair:
                     return json_repair.loads(text)
                return json.loads(text)
            except Exception as e:
                print(f"JSON Parse failed in call_ai: {e}")
                # Fallback purely manual attempt or just return text if beneficial
                # For now try to recover partial logic
                try:
                    start = text.find('{')
                    end = text.rfind('}') + 1
                    return json.loads(text[start:end])
                except:
                    print(f"Manual fallback failed. Raw: {text[:200]}")
                    return {}
        return response.text
    except Exception as e:
        print(f"AI Call failed: {e}")
        return {} if json_mode else str(e)

def update_status_helper(podcast_id, progress, message, estimated_remaining=None):
    """Helper to update podcast status in DB"""
    try:
        from .models import Podcast
        Podcast.objects.filter(id=podcast_id).update(
            progress=progress,
            current_message=list(message)[:200], # Truncate to match max_length
            processing_status='processing'
        )
        if estimated_remaining:
            Podcast.objects.filter(id=podcast_id).update(estimated_remaining=estimated_remaining)
    except Exception as e:
        print(f"Failed to update status: {e}")

# --- Nodes ---

def setup_node(state: PodcastState):
    """Loads Category Context and History"""
    print(f"DEBUG: Entering setup_node for podcast {state['podcast_id']}")
    cat = PodcastCategory.objects.get(id=state['category_id'])
    from django.contrib.auth.models import User
    user = User.objects.get(id=state['user_id'])
    
    # Load history
    bible = cat.series_bible or {}
    last_topics = bible.get('last_topics', [])
    history = "\n".join([f"- {t}" for t in last_topics[-5:]])
    
    target_lang = getattr(user.profile, 'target_language', 'en')
    
    # Defaults
    target_level = state.get('target_level', 'B1') 
    audio_speed = state.get('audio_speed', 1.0)
    
    # UPDATE STATUS
    update_status_helper(state['podcast_id'], 10, "Initializing Concept...", estimated_remaining=110)
    
    res = {
        "category_name": cat.name,
        "style": cat.style,
        "tone": cat.tone,
        "history_summary": history,
        "target_language": target_lang,
        "target_level": target_level,
        "audio_speed": audio_speed,
        "custom_topic": state.get('custom_topic'), 
        "logs": ["Context loaded."]
    }
    print(f"DEBUG: setup_node complete. State keys: {res.keys()}")
    return res

def showrunner_node(state: PodcastState):
    """Decides the Concept using ShowrunnerAgent"""
    try:
        print("DEBUG: Entering showrunner_node")
        from django.contrib.auth.models import User
        user = User.objects.get(id=state['user_id'])
        cat = PodcastCategory.objects.get(id=state['category_id'])
        
        agent = ShowrunnerAgent(user)
        # Pass custom topic if provided
        custom_topic = state.get('custom_topic')
        concept = agent.run(cat, custom_topic=custom_topic)
        
        print(f"DEBUG: Showrunner concept: {concept}")
        return {
            "concept": concept,
            "logs": state.get("logs", []) + [f"Concept: {concept.get('topic')}"]
        }
    except Exception as e:
        print(f"DEBUG: Showrunner failed logic: {e}")
        return {"logs": state.get("logs", []) + [f"Showrunner failed: {str(e)}"]}

def journalist_node(state: PodcastState):
    """Researches the topic using JournalistAgent"""
    print("DEBUG: Entering journalist_node")
    concept = state['concept']
    if not concept:
        print("DEBUG: concept is None or empty in journalist_node")
        return {"logs": state.get("logs", []) + ["No concept to research."]}

    try:
        from django.contrib.auth.models import User
        user = User.objects.get(id=state['user_id'])
        
        agent = JournalistAgent(user)
        # UPDATE STATUS
        update_status_helper(state['podcast_id'], 50, "Researching Topic...", estimated_remaining=60)
        dossier = agent.run(concept)
        
        print(f"DEBUG: Journalist dossier keys: {dossier.keys() if dossier else 'None'}")
        
        # UPDATE STATUS
        update_status_helper(state['podcast_id'], 70, "Research Complete. Writing Script...", estimated_remaining=40)

        return {
            "research_dossier": dossier,
            "logs": state.get("logs", []) + ["Research complete."]
        }
    except Exception as e:
        print(f"DEBUG: Journalist failed logic: {e}")
        return {"logs": state.get("logs", []) + [f"Journalist failed: {str(e)}"]}

def writer_node(state: PodcastState):
    """Writes the script using WriterAgent"""
    try:
        print("DEBUG: Entering writer_node")
        from django.contrib.auth.models import User
        user = User.objects.get(id=state['user_id'])
        concept = state['concept']
        research = state['research_dossier']
        
        if not concept:
             print("DEBUG: No concept for Writer")
             return {"draft_script": {}, "final_script": {}, "logs": state.get("logs", []) + ["No concept"]}
             
        # We need to re-fetch category or pass style in state
        style = state.get('style', 'Conversational')
        language = state.get('target_language', 'en')
        level = state.get('target_level', 'B1')
        
        agent = WriterAgent(user)
        script = agent.run(concept, research, style, language, level)
        
        print(f"DEBUG: Writer script keys: {script.keys() if script else 'None'}")
        
        # UPDATE STATUS
        update_status_helper(state['podcast_id'], 90, "Script Drafted. Reviewing...", estimated_remaining=20)

        return {
            "draft_script": script,
            "final_script": script, # Default to draft if no critique
            "logs": state.get("logs", []) + ["Script drafted."]
        }
    except Exception as e:
        print(f"DEBUG: Writer failed logic: {e}")
        # Fallback empty script
        return {
             "logs": state.get("logs", []) + [f"Writer failed: {str(e)}"],
             "draft_script": {},
             "final_script": {}
        }

def critic_node(state: PodcastState):
    """Reviews the script"""
    # Critic logic is simple enough to keep here or move to a CriticAgent if desired.
    script = state.get('final_script') or state.get('draft_script')
    
    prompt = f"""
    You are the Executive Producer. Review this script.
    Focus on: Pacing, Banter, Language Level.
    Script: {json.dumps(script)[:2000]}...
    
    Output string: "PASSED" or "FAILED: <reason>"
    """
    critique = call_ai(state['user_id'], prompt)
    passed = "PASSED" in critique
    return {
        "critique": critique,
        "critique_passed": passed,
        "logs": state.get("logs", []) + [f"Critique: {critique[:50]}..."]
    }

def refiner_node(state: PodcastState):
    """Rewrites script if failed"""
    script = state.get('final_script') or state.get('draft_script')
    prompt = f"""
    Fix this script based on critique: {state['critique']}
    Script: {json.dumps(script)}
    Output JSON format same as before.
    """
    
    # UPDATE STATUS
    update_status_helper(state['podcast_id'], 85, f"Refining Script (Rev {state.get('revision_count', 0)+1})...", estimated_remaining=30)
    
    new_script = call_ai(state['user_id'], prompt, max_tokens=4000, json_mode=True)
    return {
        "final_script": new_script,
        "revision_count": state.get("revision_count", 0) + 1,
        "logs": state.get("logs", []) + ["Script revised."]
    }

def validator_node(state: PodcastState):
    """Checks if script structure is valid"""
    print("DEBUG: Entering validator_node")
    script = state.get('final_script') or state.get('draft_script')
    logs = state.get("logs", [])
    
    is_valid = False
    if isinstance(script, dict):
        # Check for 'script' key and list
        if 'script' in script and isinstance(script['script'], list):
            is_valid = True
            
    # If it's a string, it's definitely invalid (needs parsing/repair)
    if isinstance(script, str):
        is_valid = False
        
    return {
        "is_valid_structure": is_valid,
        "logs": logs + [f"Validation Result: {'Valid' if is_valid else 'Invalid'}"]
    }

def structure_repair_node(state: PodcastState):
    """Attempts to repair malformed script"""
    print("DEBUG: Entering structure_repair_node")
    bad_script = state.get('final_script') or state.get('draft_script')
    
    prompt = f"""
    The following Podcast Script data is malformed. 
    It MUST be a JSON object with:
    1. 'title': string
    2. 'summary': string
    3. 'script': list of objects with 'speaker' and 'text'.
    
    Fix this structure:
    {str(bad_script)[:6000]}
    
    Return ONLY valid JSON.
    """
    
    update_status_helper(state['podcast_id'], 88, f"Repairing Structure (Attempt {state.get('repair_count', 0)+1})...")
    
    # Use json_mode=True to force valid JSON
    repaired = call_ai(state['user_id'], prompt, max_tokens=4000, json_mode=True)
    
    return {
        "final_script": repaired, # Update final script
        "repair_count": state.get("repair_count", 0) + 1,
        "logs": state.get("logs", []) + ["Performed structure repair."]
    }

# --- Graph ---
def build_podcast_graph():
    workflow = StateGraph(PodcastState)
    
    workflow.add_node("setup", setup_node)
    workflow.add_node("showrunner", showrunner_node)
    workflow.add_node("journalist", journalist_node)
    workflow.add_node("writer", writer_node)
    workflow.add_node("validator", validator_node)
    workflow.add_node("repair", structure_repair_node)
    workflow.add_node("critic", critic_node)
    workflow.add_node("refiner", refiner_node)
    
    workflow.set_entry_point("setup")
    
    workflow.add_edge("setup", "showrunner")
    workflow.add_edge("showrunner", "journalist")
    workflow.add_edge("journalist", "writer")
    workflow.add_edge("writer", "validator")
    
    def check_validity(state):
        if state.get('is_valid_structure', False):
            return "critic"
        if state.get('repair_count', 0) >= 3:
            return "critic" # Give up and proceed (or END)
        return "repair"
        
    workflow.add_conditional_edges("validator", check_validity, {
        "critic": "critic",
        "repair": "repair"
    })
    
    workflow.add_edge("repair", "validator")
    
    def check_critique(state):
        if state['critique_passed'] or state.get('revision_count', 0) >= 1: # Limit revisions to 1 for cost
            return END
        return "refiner"
        
    workflow.add_conditional_edges("critic", check_critique, {END: END, "refiner": "refiner"})
    workflow.add_edge("refiner", "critic")
    
    return workflow.compile()
