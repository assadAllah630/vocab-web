from datetime import datetime
from django.utils import timezone
from api.models import LearningEvent

def log_event(user, event_type, context=None, classroom=None):
    """
    Log a generic learning event.
    """
    if context is None:
        context = {}
        
    try:
        LearningEvent.objects.create(
            user=user,
            event_type=event_type,
            context=context,
            classroom=classroom
        )
    except Exception as e:
        # Don't crash the app if logging fails
        print(f"Error logging learning event: {e}")

def log_word_practice(user, word_id, correct, classroom=None):
    """
    Log a word practice result.
    """
    log_event(
        user=user,
        event_type='word_correct' if correct else 'word_incorrect',
        context={'word_id': word_id},
        classroom=classroom
    )

def log_exam_attempt(user, exam_id, score, classroom=None):
    """
    Log an exam completion.
    """
    log_event(
        user=user,
        event_type='exam_complete',
        context={'exam_id': exam_id, 'score': score},
        classroom=classroom
    )

def log_assignment_submission(user, assignment_id, classroom=None):
    """
    Log an assignment submission.
    """
    log_event(
        user=user,
        event_type='assignment_submit',
        context={'assignment_id': assignment_id},
        classroom=classroom
    )

def aggregate_daily_stats(user_id, date=None):
    """
    Aggregate stats for a user on a given date.
    Returns dict with words_practiced, accuracy, etc.
    """
    if date is None:
        date = timezone.now().date()
        
    events = LearningEvent.objects.filter(
        user_id=user_id,
        created_at__date=date
    )
    
    word_correct = events.filter(event_type='word_correct').count()
    word_incorrect = events.filter(event_type='word_incorrect').count()
    total_words = word_correct + word_incorrect
    accuracy = (word_correct / total_words * 100) if total_words > 0 else 0
    
    return {
        'date': date,
        'words_practiced': total_words,
        'word_accuracy': round(accuracy, 1),
        'exams_completed': events.filter(event_type='exam_complete').count(),
        'assignments_submitted': events.filter(event_type='assignment_submit').count()
    }
