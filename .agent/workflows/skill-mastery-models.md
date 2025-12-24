---
description: Create SkillMastery model and skill tracking system
---

# Skill Mastery Models

## Prerequisites
- `/learning-events-pipeline` ✅

## Purpose
Track student mastery of specific skills (vocabulary, grammar, listening, etc.)

## Step 1: Create Skill Model

Add to `models.py`:
```python
class Skill(models.Model):
    """Trackable skill category."""
    code = models.CharField(max_length=50, unique=True)  # e.g., 'vocab_b1', 'grammar_past_tense'
    name = models.CharField(max_length=100)
    CATEGORIES = [('vocabulary','Vocabulary'),('grammar','Grammar'),
                  ('listening','Listening'),('reading','Reading'),('speaking','Speaking')]
    category = models.CharField(max_length=20, choices=CATEGORIES)
    level = models.CharField(max_length=5, blank=True)  # CEFR level
    description = models.TextField(blank=True)


class SkillMastery(models.Model):
    """User's mastery level of a skill."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skill_masteries')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    
    # BKT parameters
    mastery_probability = models.FloatField(default=0.3)  # P(L) - probability of mastery
    total_attempts = models.IntegerField(default=0)
    correct_attempts = models.IntegerField(default=0)
    last_practiced = models.DateTimeField(null=True)
    
    class Meta:
        unique_together = ['user', 'skill']
```

## Step 2: Seed Default Skills

Create management command or migration data:
```python
SKILLS = [
    ('vocab_a1', 'A1 Vocabulary', 'vocabulary', 'A1'),
    ('vocab_a2', 'A2 Vocabulary', 'vocabulary', 'A2'),
    ('vocab_b1', 'B1 Vocabulary', 'vocabulary', 'B1'),
    ('grammar_present', 'Present Tense', 'grammar', 'A1'),
    ('grammar_past', 'Past Tense', 'grammar', 'A2'),
    ('grammar_cases', 'German Cases', 'grammar', 'B1'),
    ('listening_basic', 'Basic Listening', 'listening', 'A1'),
    # ... more skills
]
```

## Step 3: Skill Tracker Service

Create `services/skill_tracker.py`:
```python
def update_skill_mastery(user, skill_code, correct):
    """Update mastery using simplified BKT."""
    skill = Skill.objects.get(code=skill_code)
    mastery, _ = SkillMastery.objects.get_or_create(user=user, skill=skill)
    
    mastery.total_attempts += 1
    if correct:
        mastery.correct_attempts += 1
    
    # Simplified mastery update
    mastery.mastery_probability = mastery.correct_attempts / mastery.total_attempts
    mastery.last_practiced = timezone.now()
    mastery.save()

def get_weak_skills(user, threshold=0.5):
    """Get skills below mastery threshold."""
    return SkillMastery.objects.filter(
        user=user, mastery_probability__lt=threshold, total_attempts__gte=5
    ).select_related('skill')
```

## Next → `/knowledge-tracing-service`
