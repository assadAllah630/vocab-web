---
description: Create PodcastExam and PodcastExamAttempt database models with migration
---

# Podcast Exam Models Workflow

This workflow creates the database models for the Podcast Exam feature.

## Prerequisites

- Plan file: `.context/plans/podcast-exam-plan.md`
- Context: `.context/modules/backend/exams.context.md`

## Steps

### 1. Read the plan for model specifications

// turbo
```bash
cat .context/plans/podcast-exam-plan.md | head -150
```

### 2. Add PodcastExam model to models.py

Add the following models to `server/api/models.py`:

```python
class PodcastExam(models.Model):
    """Exam generated from a podcast episode."""
    
    LANGUAGES = [
        ('en', 'English'),
        ('de', 'German'),
        ('ar', 'Arabic'),
        ('ru', 'Russian'),
    ]
    
    FOCUS_CHOICES = [
        ('vocabulary', 'Vocabulary'),
        ('grammar', 'Grammar'),
        ('comprehension', 'Comprehension'),
        ('mixed', 'Mixed'),
    ]
    
    STATUS_CHOICES = [
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    # Core Fields
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='podcast_exams')
    podcast = models.ForeignKey('Podcast', on_delete=models.CASCADE, related_name='exams')
    
    # Exam Content
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    questions = models.JSONField(default=list)
    
    # Features
    extracted_vocabulary = models.JSONField(default=list, blank=True)
    formatted_transcript = models.TextField(blank=True)
    
    # Settings
    language = models.CharField(max_length=2, choices=LANGUAGES, default='de')
    native_language = models.CharField(max_length=2, choices=LANGUAGES, default='en')
    base_level = models.CharField(max_length=2, default='B1')
    adjusted_level = models.CharField(max_length=2, default='B1')
    focus = models.CharField(max_length=20, choices=FOCUS_CHOICES, default='mixed')
    
    # Status & Scores
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='processing')
    best_score = models.IntegerField(default=0)
    attempt_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"PodcastExam: {self.podcast.title} ({self.adjusted_level})"


class PodcastExamAttempt(models.Model):
    """User attempt on a podcast exam."""
    
    exam = models.ForeignKey(PodcastExam, on_delete=models.CASCADE, related_name='attempts')
    user_answers = models.JSONField(default=dict)
    feedback = models.JSONField(default=dict)
    score = models.IntegerField(default=0)
    time_taken = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Attempt for {self.exam.title} - {self.score}%"
```

### 3. Create database migration

// turbo
```bash
cd server && python manage.py makemigrations api --name podcast_exam_models
```

### 4. Review the migration file

Check the generated migration for correctness.

### 5. Apply migration

```bash
cd server && python manage.py migrate api
```

### 6. Add serializers to serializers.py

```python
class PodcastExamSerializer(serializers.ModelSerializer):
    podcast_title = serializers.CharField(source='podcast.title', read_only=True)
    podcast_audio = serializers.FileField(source='podcast.audio_file', read_only=True)
    
    class Meta:
        model = PodcastExam
        fields = [
            'id', 'title', 'description', 'questions',
            'extracted_vocabulary', 'formatted_transcript',
            'language', 'native_language', 'base_level', 'adjusted_level', 'focus',
            'status', 'best_score', 'attempt_count',
            'podcast', 'podcast_title', 'podcast_audio',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'status']


class PodcastExamAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = PodcastExamAttempt
        fields = ['id', 'exam', 'user_answers', 'feedback', 'score', 'time_taken', 'created_at']
        read_only_fields = ['id', 'created_at']
```

### 7. Update exams.context.md

Add PodcastExam model reference to `.context/modules/backend/exams.context.md`

## Verification

// turbo
```bash
cd server && python manage.py check
```

## Rollback

```bash
cd server && python manage.py migrate api <previous_migration_number>
```

---

*Workflow version: 1.0*
