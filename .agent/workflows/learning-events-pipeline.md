---
description: Create learning events capture and aggregation pipeline for AI insights
---

# Learning Events Pipeline

## Prerequisites
- `/assignment-models` ✅

## Purpose
Capture granular learning events for AI analysis: practice sessions, errors, time spent, etc.

## Step 1: Create LearningEvent Model

Add to `models.py`:
```python
class LearningEvent(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    EVENT_TYPES = [
        ('practice_start', 'Practice Started'),
        ('practice_end', 'Practice Ended'),
        ('word_correct', 'Word Correct'),
        ('word_incorrect', 'Word Incorrect'),
        ('exam_answer', 'Exam Answer'),
        ('content_view', 'Content Viewed'),
        ('content_complete', 'Content Completed'),
    ]
    event_type = models.CharField(max_length=30, choices=EVENT_TYPES)
    context = models.JSONField(default=dict)  # word_id, exam_id, etc.
    classroom = models.ForeignKey(Classroom, null=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [models.Index(fields=['user', 'event_type', 'created_at'])]
```

## Step 2: Create Event Logging Service

Create `services/learning_events.py`:
```python
def log_event(user, event_type, context=None, classroom=None):
    LearningEvent.objects.create(
        user=user, event_type=event_type,
        context=context or {}, classroom=classroom
    )

def log_word_practice(user, word_id, correct, classroom=None):
    log_event(user, 'word_correct' if correct else 'word_incorrect',
              {'word_id': word_id}, classroom)
```

## Step 3: Integrate into Existing Code

Add event logging to:
- Flashcard practice (word correct/incorrect)
- Exam submissions (each answer)
- Content viewing (stories, articles)
- Game completions

## Step 4: Aggregation Task (Celery/Background)

```python
def aggregate_daily_stats(user_id, date):
    events = LearningEvent.objects.filter(user_id=user_id, created_at__date=date)
    return {
        'words_practiced': events.filter(event_type__in=['word_correct','word_incorrect']).count(),
        'accuracy': calculate_accuracy(events),
        'time_spent': calculate_time(events),
    }
```

## Next → `/skill-mastery-models`
