---
description: LangGraph agent for generating personalized student insights
---

# Student Insight Agent

## Prerequisites
- `/weakness-detection-service` ✅
- Existing `unified_ai` module

## Overview
LangGraph-based AI agent that generates **natural language insights** about student progress, combining data analysis with AI interpretation.

## Agent Architecture

```
┌─────────────────────────────────────────────────┐
│                 Insight Agent                    │
├─────────────────────────────────────────────────┤
│  [Gather Data] → [Analyze] → [Generate] → [Out] │
│       ↓              ↓            ↓              │
│   - Progress     - Trends     - Summary         │
│   - Weaknesses   - Compare    - Suggestions     │
│   - Events       - Patterns   - Alerts          │
└─────────────────────────────────────────────────┘
```

## Create `agents/student_insight_agent.py`

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, List
from api.services.weakness_detector import generate_weakness_summary
from api.services.unified_ai import generate_ai_content

class InsightState(TypedDict):
    student_id: int
    classroom_id: int
    data: dict
    analysis: str
    insights: List[str]
    summary: str

def gather_data(state: InsightState) -> InsightState:
    """Collect all relevant student data."""
    from api.models import User, AssignmentProgress, SkillMastery
    
    user = User.objects.get(id=state['student_id'])
    progress = AssignmentProgress.objects.filter(student=user)
    masteries = SkillMastery.objects.filter(user=user)
    
    state['data'] = {
        'username': user.username,
        'assignments_completed': progress.filter(status__in=['submitted','graded']).count(),
        'avg_score': progress.filter(score__isnull=False).aggregate(Avg('score'))['score__avg'],
        'top_skills': list(masteries.order_by('-mastery_probability')[:3].values('skill__name', 'mastery_probability')),
        'weaknesses': generate_weakness_summary(user),
    }
    return state

def analyze_trends(state: InsightState) -> InsightState:
    """Analyze patterns and generate structured analysis."""
    d = state['data']
    
    analysis_parts = [
        f"Student: {d['username']}",
        f"Completed {d['assignments_completed']} assignments",
        f"Average score: {d['avg_score']:.1f}%" if d['avg_score'] else "No scores yet",
        f"Weaknesses: {d['weaknesses']}",
    ]
    state['analysis'] = '\n'.join(analysis_parts)
    return state

def generate_insights(state: InsightState) -> InsightState:
    """Use AI to generate natural language insights."""
    prompt = f"""As a language learning advisor, provide 3 brief, actionable insights for this student:

{state['analysis']}

Format: Return exactly 3 bullet points, each under 20 words. Focus on specific, helpful advice."""

    response = generate_ai_content(prompt, quality_tier='fast')
    state['insights'] = [line.strip('- •') for line in response.split('\n') if line.strip()][:3]
    return state

def create_summary(state: InsightState) -> InsightState:
    """Create final summary."""
    state['summary'] = f"**{state['data']['username']}** - " + ' | '.join(state['insights'][:2])
    return state

# Build Graph
workflow = StateGraph(InsightState)
workflow.add_node("gather", gather_data)
workflow.add_node("analyze", analyze_trends)
workflow.add_node("generate", generate_insights)
workflow.add_node("summarize", create_summary)

workflow.set_entry_point("gather")
workflow.add_edge("gather", "analyze")
workflow.add_edge("analyze", "generate")
workflow.add_edge("generate", "summarize")
workflow.add_edge("summarize", END)

insight_agent = workflow.compile()

# Usage
def get_student_insights(student_id: int, classroom_id: int = None) -> dict:
    result = insight_agent.invoke({
        'student_id': student_id,
        'classroom_id': classroom_id,
        'data': {}, 'analysis': '', 'insights': [], 'summary': ''
    })
    return {'insights': result['insights'], 'summary': result['summary']}
```

## Next → `/recommendation-agent`
