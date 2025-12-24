---
description: Create Assignment and AssignmentProgress database models with migrations
---

# Assignment Models

## Prerequisites
- `/classroom-models` ✅

## Step 1: Add to `models.py`

```python
class Assignment(models.Model):
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='assignments')
    CONTENT_TYPES = [('exam','Exam'),('story','Story'),('article','Article'),
                     ('grammar','Grammar'),('vocab_list','Vocab'),('podcast','Podcast')]
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPES)
    content_id = models.IntegerField(null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    is_required = models.BooleanField(default=True)
    max_attempts = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

class AssignmentProgress(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='progress')
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    STATUS = [('not_started','Not Started'),('in_progress','In Progress'),
              ('submitted','Submitted'),('graded','Graded')]
    status = models.CharField(max_length=20, choices=STATUS, default='not_started')
    started_at = models.DateTimeField(null=True)
    submitted_at = models.DateTimeField(null=True)
    score = models.FloatField(null=True)
    feedback = models.TextField(blank=True)
    class Meta:
        unique_together = ['assignment', 'student']
```

## Step 2: Migration
```bash
// turbo
py manage.py makemigrations api --name assignment_models && py manage.py migrate
```

## Step 3: Serializers
Add `AssignmentSerializer` and `AssignmentProgressSerializer` to `serializers.py`

## Next → `/assignment-api`
