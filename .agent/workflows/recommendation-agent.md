---
description: LangGraph agent for generating personalized content recommendations
---

# Recommendation Agent

## Prerequisites
- `/student-insight-agent` ✅
- `/weakness-detection-service` ✅

## Overview
AI agent that recommends **next learning activities** based on weaknesses, mastery levels, and learning patterns.

## Recommendation Types

| Type | Trigger | Example |
|------|---------|---------|
| **Practice** | Low mastery skill | "Practice B1 vocabulary flashcards" |
| **Review** | Decaying skill | "Review past tense - 14 days since practice" |
| **New Content** | High mastery, ready to advance | "Try C1 reading exercise" |
| **Blind Spot** | Never practiced area | "Start listening exercises" |
| **Assignment** | Pending due soon | "Complete Week 3 Quiz (due tomorrow)" |

## Create `agents/recommendation_agent.py`

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, List
from dataclasses import dataclass

@dataclass
class Recommendation:
    type: str          # practice, review, new, assignment
    priority: int      # 1-5 (5 = urgent)
    title: str
    reason: str
    action_url: str

class RecommendState(TypedDict):
    user_id: int
    weaknesses: dict
    assignments: list
    recommendations: List[dict]

def analyze_needs(state: RecommendState) -> RecommendState:
    """Identify what the student needs most."""
    from api.services.weakness_detector import WeaknessDetector
    from api.models import User, AssignmentProgress
    
    user = User.objects.get(id=state['user_id'])
    detector = WeaknessDetector(user)
    state['weaknesses'] = detector.detect_all()
    
    # Pending assignments
    pending = AssignmentProgress.objects.filter(
        student=user,
        status__in=['not_started', 'in_progress']
    ).select_related('assignment')
    state['assignments'] = list(pending.values('assignment__title', 'assignment__due_date'))
    
    return state

def generate_recommendations(state: RecommendState) -> RecommendState:
    """Generate prioritized recommendations."""
    recs = []
    w = state['weaknesses']
    
    # Priority 5: Overdue assignments
    for a in state['assignments']:
        if a['assignment__due_date'] and a['assignment__due_date'] < timezone.now():
            recs.append({
                'type': 'assignment', 'priority': 5,
                'title': f"Overdue: {a['assignment__title']}",
                'reason': 'This assignment is past due'
            })
    
    # Priority 4: Skill weaknesses
    for skill in w.get('skill_weaknesses', [])[:3]:
        recs.append({
            'type': 'practice', 'priority': 4,
            'title': f"Practice {skill['skill__name']}",
            'reason': f"Mastery at {skill['mastery_probability']:.0%}"
        })
    
    # Priority 3: Decaying skills
    for skill in w.get('decaying_skills', [])[:2]:
        recs.append({
            'type': 'review', 'priority': 3,
            'title': f"Review {skill['skill__name']}",
            'reason': 'Haven\'t practiced recently'
        })
    
    # Priority 2: Blind spots
    for area in w.get('blind_spots', []):
        recs.append({
            'type': 'new', 'priority': 2,
            'title': f"Explore {area.title()} exercises",
            'reason': 'New skill area to develop'
        })
    
    # Sort by priority
    state['recommendations'] = sorted(recs, key=lambda x: -x['priority'])[:5]
    return state

# Build Graph
workflow = StateGraph(RecommendState)
workflow.add_node("analyze", analyze_needs)
workflow.add_node("recommend", generate_recommendations)
workflow.set_entry_point("analyze")
workflow.add_edge("analyze", "recommend")
workflow.add_edge("recommend", END)

recommendation_agent = workflow.compile()

def get_recommendations(user_id: int) -> List[dict]:
    result = recommendation_agent.invoke({
        'user_id': user_id, 'weaknesses': {}, 
        'assignments': [], 'recommendations': []
    })
    return result['recommendations']
```

## API Endpoint
```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_recommendations(request):
    recs = get_recommendations(request.user.id)
    return Response(recs)
```

## Next → `/ai-insights-api`
