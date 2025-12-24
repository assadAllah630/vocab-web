---
description: API endpoints for AI insights, recommendations, and analytics
---

# AI Insights API

## Prerequisites
- `/student-insight-agent` ✅
- `/recommendation-agent` ✅

## Overview
Exposes AI-powered insights through RESTful endpoints for both teachers and students.

## Create `views/ai_insights_views.py`

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.cache import cache

from api.agents.student_insight_agent import get_student_insights
from api.agents.recommendation_agent import get_recommendations
from api.services.weakness_detector import WeaknessDetector
from api.permissions import IsTeacher


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_insights(request):
    """Get AI-generated insights for current user."""
    cache_key = f"insights_{request.user.id}"
    insights = cache.get(cache_key)
    
    if not insights:
        insights = get_student_insights(request.user.id)
        cache.set(cache_key, insights, 3600)  # 1 hour cache
    
    return Response(insights)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_recommendations(request):
    """Get personalized learning recommendations."""
    cache_key = f"recs_{request.user.id}"
    recs = cache.get(cache_key)
    
    if not recs:
        recs = get_recommendations(request.user.id)
        cache.set(cache_key, recs, 1800)  # 30 min cache
    
    return Response(recs)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_weaknesses(request):
    """Get detected weaknesses and areas for improvement."""
    detector = WeaknessDetector(request.user)
    return Response(detector.detect_all())


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTeacher])
def student_insights(request, classroom_id, student_id):
    """Teacher view: Get insights for a specific student."""
    # Verify teacher owns classroom
    if not request.user.teacher_profile.classrooms.filter(id=classroom_id).exists():
        return Response({'error': 'Access denied'}, status=403)
    
    insights = get_student_insights(student_id, classroom_id)
    weaknesses = WeaknessDetector(User.objects.get(id=student_id)).detect_all()
    
    return Response({
        'insights': insights,
        'weaknesses': weaknesses
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTeacher])
def classroom_ai_summary(request, classroom_id):
    """AI summary of entire classroom performance."""
    classroom = request.user.teacher_profile.classrooms.get(id=classroom_id)
    students = classroom.memberships.filter(status='active').values_list('student_id', flat=True)
    
    # Aggregate weaknesses across class
    all_weak_skills = []
    for sid in students[:20]:  # Limit for performance
        detector = WeaknessDetector(User.objects.get(id=sid))
        all_weak_skills.extend([w['skill__code'] for w in detector.detect_skill_weaknesses()])
    
    # Find common weaknesses
    from collections import Counter
    common = Counter(all_weak_skills).most_common(5)
    
    return Response({
        'classroom': classroom.name,
        'student_count': len(students),
        'common_weaknesses': [{'skill': s, 'count': c} for s, c in common],
    })
```

## URLs
```python
# Student endpoints
path('ai/insights/', my_insights),
path('ai/recommendations/', my_recommendations),
path('ai/weaknesses/', my_weaknesses),

# Teacher endpoints
path('ai/classrooms/<int:classroom_id>/students/<int:student_id>/', student_insights),
path('ai/classrooms/<int:classroom_id>/summary/', classroom_ai_summary),
```

## API Summary

| Endpoint | User | Purpose |
|----------|------|---------|
| `GET /ai/insights/` | Student | Personal AI insights |
| `GET /ai/recommendations/` | Student | What to learn next |
| `GET /ai/weaknesses/` | Student | Weakness analysis |
| `GET /ai/classrooms/{id}/students/{id}/` | Teacher | Student insights |
| `GET /ai/classrooms/{id}/summary/` | Teacher | Class-wide analysis |

## Caching Strategy
- Insights: 1 hour (computationally expensive)
- Recommendations: 30 min (changes with activity)
- Weaknesses: No cache (always fresh)

## Next → `/ai-dashboard-widgets`
