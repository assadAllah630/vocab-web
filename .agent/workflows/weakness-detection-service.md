---
description: Detect learning weaknesses through error pattern analysis
---

# Weakness Detection Service

## Prerequisites
- `/knowledge-tracing-service` ✅

## Overview
Analyzes error patterns to identify specific weaknesses beyond just low mastery scores. Uses statistical analysis and pattern recognition.

## Weakness Categories

| Type | Detection Method |
|------|------------------|
| **Skill Weakness** | Low mastery + high attempt count |
| **Error Pattern** | Repeated same mistakes (confusions) |
| **Decay** | Mastery drop over time (forgetting) |
| **Speed Issue** | Correct but slow responses |
| **Blind Spot** | Never attempted skill area |

## Create `services/weakness_detector.py`

```python
from collections import Counter
from datetime import timedelta
from django.utils import timezone
from django.db.models import Avg, Count, F
from api.models import LearningEvent, SkillMastery, Word

class WeaknessDetector:
    def __init__(self, user):
        self.user = user
    
    def detect_all(self) -> dict:
        return {
            'skill_weaknesses': self.detect_skill_weaknesses(),
            'error_patterns': self.detect_error_patterns(),
            'decaying_skills': self.detect_decay(),
            'blind_spots': self.detect_blind_spots(),
        }
    
    def detect_skill_weaknesses(self, threshold=0.4, min_attempts=5):
        """Skills with low mastery despite practice."""
        return list(SkillMastery.objects.filter(
            user=self.user,
            mastery_probability__lt=threshold,
            total_attempts__gte=min_attempts
        ).values('skill__code', 'skill__name', 'mastery_probability', 'total_attempts'))
    
    def detect_error_patterns(self, days=30):
        """Find commonly confused word pairs."""
        since = timezone.now() - timedelta(days=days)
        errors = LearningEvent.objects.filter(
            user=self.user,
            event_type='word_incorrect',
            created_at__gte=since
        ).values_list('context__word_id', flat=True)
        
        # Find words with 3+ errors
        error_counts = Counter(errors)
        problem_words = [wid for wid, count in error_counts.items() if count >= 3]
        
        return list(Word.objects.filter(id__in=problem_words).values('id', 'word', 'translation'))
    
    def detect_decay(self, days_inactive=14, decay_threshold=0.15):
        """Skills losing mastery due to inactivity."""
        cutoff = timezone.now() - timedelta(days=days_inactive)
        return list(SkillMastery.objects.filter(
            user=self.user,
            last_practiced__lt=cutoff,
            mastery_probability__gt=0.5  # Was good, needs refresh
        ).values('skill__code', 'skill__name', 'last_practiced'))
    
    def detect_blind_spots(self):
        """Skill categories never practiced."""
        practiced = set(SkillMastery.objects.filter(user=self.user).values_list('skill__category', flat=True))
        all_categories = {'vocabulary', 'grammar', 'listening', 'reading', 'speaking'}
        return list(all_categories - practiced)

def generate_weakness_summary(user) -> str:
    """Generate AI-friendly summary for insight agent."""
    detector = WeaknessDetector(user)
    w = detector.detect_all()
    
    parts = []
    if w['skill_weaknesses']:
        skills = ', '.join(s['skill__name'] for s in w['skill_weaknesses'][:5])
        parts.append(f"Struggling with: {skills}")
    if w['error_patterns']:
        words = ', '.join(p['word'] for p in w['error_patterns'][:5])
        parts.append(f"Often mistakes: {words}")
    if w['decaying_skills']:
        parts.append(f"{len(w['decaying_skills'])} skills need review")
    if w['blind_spots']:
        parts.append(f"Unexplored areas: {', '.join(w['blind_spots'])}")
    
    return ' | '.join(parts) if parts else "No significant weaknesses detected"
```

## API Endpoint
```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_weaknesses(request):
    detector = WeaknessDetector(request.user)
    return Response(detector.detect_all())
```

## Next → `/student-insight-agent`
