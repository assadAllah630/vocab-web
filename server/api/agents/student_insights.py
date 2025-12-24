import json
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
from django.db.models import Avg

from api.models import User, AssignmentProgress, SkillMastery, LearningEvent
from api.services.weakness.service import WeaknessService
from api.unified_ai import generate_ai_content

class InsightState(TypedDict):
    student_id: int
    context_str: str
    draft: str
    final_insights: Dict[str, Any]

def gather_data_node(state: InsightState) -> InsightState:
    """Collect all relevant student data."""
    try:
        user = User.objects.get(id=state['student_id'])
    except User.DoesNotExist:
        return {"context_str": "User not found."}

    # 1. Weakness Analysis
    weakness_service = WeaknessService()
    weaknesses = weakness_service.detect_weaknesses(user)
    weakness_summary = weaknesses.get('summary', 'No data')
    top_weaknesses = [w['title'] for w in weaknesses.get('items', [])[:3]]

    # 2. Assignment Stats
    progress = AssignmentProgress.objects.filter(student=user)
    completed_count = progress.filter(status__in=['submitted', 'graded']).count()
    avg_score = progress.filter(score__isnull=False).aggregate(Avg('score'))['score__avg']
    avg_score_str = f"{avg_score:.1f}%" if avg_score else "N/A"

    # 3. Top Skills
    masteries = SkillMastery.objects.filter(user=user).order_by('-mastery_probability')
    top_skills = list(masteries[:3].values_list('skill__name', flat=True))

    # 4. Recent Activity
    recent_events = LearningEvent.objects.filter(user=user).order_by('-created_at')[:5]
    recent_activity = [str(e) for e in recent_events]

    context_parts = [
        f"Student: {user.username}",
        f"Assignments Completed: {completed_count}",
        f"Average Score: {avg_score_str}",
        f"Top Skills: {', '.join(top_skills) if top_skills else 'None'}",
        f"Weakness Summary: {weakness_summary}",
        f"Key Weaknesses: {', '.join(top_weaknesses)}",
        "Recent Activity Log:",
        "\n".join(recent_activity)
    ]
    
    return {"context_str": "\n".join(context_parts)}

def draft_analysis_node(state: InsightState) -> InsightState:
    """Generate initial analysis using AI."""
    try:
        prompt = f"""You are an expert language learning coach. Analyze the following student data and identify 3 key observations.
Focus on patterns, progress, and specific areas for improvement.

Student Data:
{state['context_str']}

Output 3 distinct observations. Be direct and analytical.
"""
        response = generate_ai_content(
            user=None, # System context
            prompt=prompt, 
            quality_tier='high'
        )
        return {"draft": response.text}
    except Exception as e:
        print(f"Error in draft_analysis_node: {e}")
        return {"draft": "Error: Could not analyze student data."}

def refine_insights_node(state: InsightState) -> InsightState:
    """Refine analysis into strictly actionable advice."""
    try:
        prompt = f"""Review the following observations and rewrite them into a structured JSON response for the student dashboard.
The output must contain exactly 3 items.
Each item must have:
- 'title': Short, encouraging title (max 5 words)
- 'body': Specific, actionable advice (max 20 words). Direct address "You should...".
- 'type': 'praise' | 'alert' | 'tip'

Draft Observations:
{state['draft']}

Student Context (for reference):
{state['context_str']}

Respond ONLY with valid JSON in this format:
{{
  "insights": [
    {{ "title": "...", "body": "...", "type": "..." }},
    ...
  ]
}}
"""
        response = generate_ai_content(
            user=None, 
            prompt=prompt, 
            quality_tier='high',
            json_mode=True
        )
        
        data = json.loads(response.text)
        # Ensure correct structure fallback
        if 'insights' not in data:
            data = {'insights': []}
            
        return {"final_insights": data}
    except Exception as e:
        print(f"Error in refine_insights_node: {e}")
        return {"final_insights": {'insights': [{'title': 'Notice', 'body': 'Insights are temporarily unavailable. Keep practicing!', 'type': 'tip'}]}}

# Build Graph
workflow = StateGraph(InsightState)
workflow.add_node("gather", gather_data_node)
workflow.add_node("draft", draft_analysis_node)
workflow.add_node("refine", refine_insights_node)

workflow.set_entry_point("gather")
workflow.add_edge("gather", "draft")
workflow.add_edge("draft", "refine")
workflow.add_edge("refine", END)

student_insight_agent = workflow.compile()

def run_student_insights(user_id: int):
    """Entry point to run the agent."""
    result = student_insight_agent.invoke({
        "student_id": user_id,
        "context_str": "",
        "draft": "",
        "final_insights": {}
    })
    return result["final_insights"]
