from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Dict, Any
import json
from api.services.recommendations.engine import RecommendationEngine
from api.unified_ai import generate_ai_content

class RecState(TypedDict):
    user_id: int
    user_object: Any
    raw_recs: List[Dict[str, Any]]
    final_recs: List[Dict[str, Any]]
    insights: str # New field

def fetch_recs_node(state: RecState) -> RecState:
    from api.models import User
    from api.services.recommendations.engine import RecommendationEngine
    from api.agents.student_insights import run_student_insights

    user = state['user_object']
    engine = RecommendationEngine()
    recs = engine.get_recommendations(user)
    
    # Fetch insights (synchronously for now)
    try:
        insight_data = run_student_insights(user.id)
        # Flatten insights into a string for the prompt
        insights_list = [f"{i['title']}: {i['body']}" for i in insight_data.get('insights', [])]
        insights_str = "\n".join(insights_list)
    except:
        insights_str = "No specific insights available."

    return {"raw_recs": recs, "insights": insights_str}

def personalize_node(state: RecState) -> RecState:
    """Rewrite titles to be more engaging using AI and Student Insights."""
    if not state['raw_recs']:
        return {"final_recs": []}
        
    prompt = f"""Rewrite these learning recommendations to be highly personalized.
    
Student Context:
{state.get('insights', 'No context')}

Recommendations:
{json.dumps(state['raw_recs'])}

Instructions:
1. Rewrite the 'title' to be a punchy call-to-action (max 6 words).
2. Use the student's context (weaknesses/strengths) to frame the title if relevant.
3. Keep the original meaning.

Return valid JSON:
[
  {{ "title": "...", "original_index": 0 }},
  ...
]
"""
    try:
        response = generate_ai_content(
            user=state.get('user_object'), 
            prompt=prompt, 
            quality_tier='fast', 
            json_mode=True
        )
        rewrites = json.loads(response.text)
        
        final = state['raw_recs'].copy()
        for item in rewrites:
            idx = item.get('original_index')
            new_title = item.get('title')
            if idx is not None and 0 <= idx < len(final) and new_title:
                final[idx]['title'] = new_title
                final[idx]['is_personalized'] = True
                
        return {"final_recs": final}
    except Exception as e:
        print(f"Personalization failed: {e}")
        return {"final_recs": state['raw_recs']}

# Graph
workflow = StateGraph(RecState)
workflow.add_node("fetch", fetch_recs_node)
workflow.add_node("personalize", personalize_node)

workflow.set_entry_point("fetch")
workflow.add_edge("fetch", "personalize")
workflow.add_edge("personalize", END)

recommendation_agent = workflow.compile()


def get_personalized_recommendations(user_id: int):
    from api.models import User
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return []

    result = recommendation_agent.invoke({
        "user_id": user_id, 
        "user_object": user,
        "raw_recs": [], 
        "final_recs": []
    })
    return result["final_recs"]
