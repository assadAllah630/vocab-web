---
description: Create API endpoints for podcast exam generation and management
---

# Podcast Exam API Workflow

This workflow creates the API endpoints for podcast exam generation.

## Prerequisites

- Models created via `/podcast-exam-models`
- Agent created via `/podcast-exam-agent`
- Context: `.context/modules/backend/exams.context.md`

## Steps

### 1. Add generate_podcast_exam endpoint to ai_views.py

Add to `server/api/ai_views.py`:

```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_podcast_exam(request):
    """
    Generate an exam from a podcast script.
    
    Request body:
    {
        "podcast_id": 123,
        "question_count": 10,
        "question_types": ["cloze", "multiple_choice", "matching", "reading", "listening"],
        "focus": "vocabulary",
        "difficulty_adjustment": 0
    }
    
    Returns:
    {
        "exam_id": 456,
        "status": "completed",
        "message": "Exam generated successfully"
    }
    """
    from .models import Podcast, PodcastExam
    from .agent_podcast_exam import build_podcast_exam_graph
    
    podcast_id = request.data.get('podcast_id')
    question_count = request.data.get('question_count', 10)
    question_types = request.data.get('question_types', 
        ['cloze', 'multiple_choice', 'matching', 'reading', 'listening'])
    focus = request.data.get('focus', 'mixed')
    difficulty_adjustment = request.data.get('difficulty_adjustment', 0)
    
    # Validate podcast exists and has script
    try:
        podcast = Podcast.objects.get(id=podcast_id, user=request.user)
    except Podcast.DoesNotExist:
        return Response({'error': 'Podcast not found'}, status=404)
    
    # Check for script
    script = podcast.speech_marks or []
    if not script and not podcast.text_content:
        return Response({
            'error': 'No script available',
            'message': 'Please generate the podcast script first'
        }, status=400)
    
    # Create PodcastExam record in processing state
    base_level = 'B1'
    if podcast.category:
        base_level = podcast.category.target_audience or 'B1'
    
    podcast_exam = PodcastExam.objects.create(
        user=request.user,
        podcast=podcast,
        title=f"Exam: {podcast.title}",
        status='processing',
        base_level=base_level,
        focus=focus
    )
    
    # Run the LangGraph agent
    try:
        graph = build_podcast_exam_graph()
        initial_state = {
            'podcast_id': podcast_id,
            'user_id': request.user.id,
            'question_count': question_count,
            'question_types': question_types,
            'focus': focus,
            'difficulty_adjustment': difficulty_adjustment,
            'logs': []
        }
        
        final_state = graph.invoke(initial_state, config={'configurable': {'user': request.user}})
        
        # Update the exam with results
        podcast_exam.questions = final_state.get('final_exam', {}).get('sections', [])
        podcast_exam.extracted_vocabulary = final_state.get('extracted_vocabulary', [])
        podcast_exam.formatted_transcript = final_state.get('formatted_transcript', '')
        podcast_exam.adjusted_level = final_state.get('adjusted_level', base_level)
        podcast_exam.status = 'completed'
        podcast_exam.save()
        
        return Response({
            'exam_id': podcast_exam.id,
            'status': 'completed',
            'message': 'Exam generated successfully'
        })
        
    except Exception as e:
        podcast_exam.status = 'failed'
        podcast_exam.save()
        return Response({'error': str(e)}, status=500)
```

### 2. Add view classes for CRUD

Add to `server/api/views/feature_views.py` or appropriate file:

```python
from rest_framework import generics
from ..models import PodcastExam, PodcastExamAttempt
from ..serializers import PodcastExamSerializer, PodcastExamAttemptSerializer


class PodcastExamListView(generics.ListAPIView):
    """List all podcast exams for authenticated user."""
    serializer_class = PodcastExamSerializer
    
    def get_queryset(self):
        return PodcastExam.objects.filter(user=self.request.user)


class PodcastExamDetailView(generics.RetrieveAPIView):
    """Get single podcast exam with all details."""
    serializer_class = PodcastExamSerializer
    
    def get_queryset(self):
        return PodcastExam.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_podcast_exam_attempt(request, pk):
    """Submit answers for a podcast exam."""
    try:
        exam = PodcastExam.objects.get(id=pk, user=request.user)
    except PodcastExam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)
    
    user_answers = request.data.get('user_answers', {})
    time_taken = request.data.get('time_taken', 0)
    
    # Calculate score
    score = calculate_podcast_exam_score(exam, user_answers)
    
    # Create attempt
    attempt = PodcastExamAttempt.objects.create(
        exam=exam,
        user_answers=user_answers,
        score=score,
        time_taken=time_taken
    )
    
    # Update exam stats
    exam.attempt_count += 1
    if score > exam.best_score:
        exam.best_score = score
    exam.save()
    
    return Response({
        'attempt_id': attempt.id,
        'score': score,
        'message': 'Attempt saved successfully'
    })


def calculate_podcast_exam_score(exam, user_answers):
    """Calculate score based on exam questions and user answers."""
    total = 0
    correct = 0
    
    for section in exam.questions:
        section_type = section.get('type')
        
        if section_type in ['multiple_choice', 'reading']:
            for q in section.get('questions', []):
                total += 1
                correct_idx = q.get('correct_index')
                correct_text = q.get('options', [])[correct_idx] if correct_idx is not None else None
                if user_answers.get(q.get('id')) == correct_text:
                    correct += 1
                    
        elif section_type == 'cloze':
            for blank in section.get('blanks', []):
                total += 1
                if str(user_answers.get(str(blank.get('id', '')))).lower() == str(blank.get('answer', '')).lower():
                    correct += 1
                    
        elif section_type == 'matching':
            for pair in section.get('pairs', []):
                total += 1
                pair_id = pair.get('id', f"match-{section.get('pairs', []).index(pair)}")
                if user_answers.get(pair_id) == pair.get('right'):
                    correct += 1
                    
        elif section_type == 'listening':
            for clip in section.get('clips', []):
                total += 1
                correct_idx = clip.get('correct_index')
                correct_text = clip.get('options', [])[correct_idx] if correct_idx is not None else None
                if user_answers.get(clip.get('id')) == correct_text:
                    correct += 1
    
    return round((correct / total) * 100) if total > 0 else 0
```

### 3. Add URL routes

Add to `server/api/urls.py`:

```python
from .ai_views import generate_podcast_exam
from .views.feature_views import PodcastExamListView, PodcastExamDetailView, submit_podcast_exam_attempt

urlpatterns = [
    # ... existing patterns ...
    
    # Podcast Exam endpoints
    path('generate-podcast-exam/', generate_podcast_exam, name='generate_podcast_exam'),
    path('podcast-exams/', PodcastExamListView.as_view(), name='podcast_exam_list'),
    path('podcast-exams/<int:pk>/', PodcastExamDetailView.as_view(), name='podcast_exam_detail'),
    path('podcast-exams/<int:pk>/submit/', submit_podcast_exam_attempt, name='submit_podcast_exam'),
]
```

### 4. Test the endpoints

// turbo
```bash
cd server && python manage.py check
```

### 5. Run server and test manually

```bash
cd server && python manage.py runserver
```

Test with:
```bash
curl -X POST http://localhost:8000/api/generate-podcast-exam/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"podcast_id": 1, "question_count": 10}'
```

## Verification

// turbo
```bash
cd server && python manage.py test api.tests.test_podcast_exam_views
```

---

*Workflow version: 1.0*
