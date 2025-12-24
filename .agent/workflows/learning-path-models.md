---
description: Create LearningPath and PathProgress models for structured curriculum
---

# Learning Path Models

## Prerequisites
- `/assignment-models` ✅

## Concept
**Learning Paths** = Structured sequences of content (lessons, exercises, exams) that guide students through a curriculum. Think "course" or "module".

## Data Model Design

```
LearningPath (1) ──→ (N) PathNode ──→ Content
      │                    │
      └──→ (N) PathEnrollment ←── User
                    │
                    └──→ (N) NodeProgress
```

## Create Models in `models.py`

```python
class LearningPath(models.Model):
    """Structured learning curriculum."""
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='paths')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    level = models.CharField(max_length=10)  # CEFR
    language = models.CharField(max_length=2, default='de')
    
    # Structure
    estimated_hours = models.FloatField(default=10)
    is_published = models.BooleanField(default=False)
    is_sequential = models.BooleanField(default=True)  # Must complete in order?
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']


class PathNode(models.Model):
    """Single item in a learning path."""
    path = models.ForeignKey(LearningPath, on_delete=models.CASCADE, related_name='nodes')
    order = models.IntegerField(default=0)
    
    NODE_TYPES = [
        ('lesson', 'Lesson'),      # Text/video content
        ('exercise', 'Exercise'),  # Practice activity
        ('exam', 'Exam'),          # Assessment
        ('checkpoint', 'Checkpoint'),  # Progress marker
    ]
    node_type = models.CharField(max_length=20, choices=NODE_TYPES)
    
    # Content reference (polymorphic)
    content_type = models.CharField(max_length=30)  # story, grammar, exam, etc.
    content_id = models.IntegerField(null=True)
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    duration_minutes = models.IntegerField(default=15)
    
    # Requirements
    pass_threshold = models.IntegerField(default=70)  # For exams
    
    class Meta:
        ordering = ['path', 'order']
        unique_together = ['path', 'order']


class PathEnrollment(models.Model):
    """User enrollment in a learning path."""
    path = models.ForeignKey(LearningPath, on_delete=models.CASCADE)
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    classroom = models.ForeignKey(Classroom, null=True, on_delete=models.SET_NULL)
    
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True)
    
    class Meta:
        unique_together = ['path', 'student']


class NodeProgress(models.Model):
    """Progress on a single path node."""
    enrollment = models.ForeignKey(PathEnrollment, on_delete=models.CASCADE, related_name='progress')
    node = models.ForeignKey(PathNode, on_delete=models.CASCADE)
    
    STATUS = [('locked','Locked'),('available','Available'),
              ('in_progress','In Progress'),('completed','Completed')]
    status = models.CharField(max_length=20, default='locked')
    
    started_at = models.DateTimeField(null=True)
    completed_at = models.DateTimeField(null=True)
    score = models.FloatField(null=True)
    attempts = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ['enrollment', 'node']
```

## Migration
```bash
// turbo
py manage.py makemigrations api --name learning_path_models && py manage.py migrate
```

## Next → `/learning-path-frontend`
