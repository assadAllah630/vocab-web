from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions
from rest_framework.response import Response
from ..models import Vocabulary, UserProgress, Quiz
from ..hlr import HLRScheduler
from django.utils import timezone
from datetime import timedelta
from django.db.models.functions import TruncDate
from django.db.models import Count

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_statistics(request):
    user = request.user
    total_words = Vocabulary.objects.filter(created_by=user).count()
    mastered_words_count = UserProgress.objects.filter(user=user, repetition_stage__gte=4).count()
    learning_words_count = UserProgress.objects.filter(user=user, repetition_stage__gt=0, repetition_stage__lt=4).count()
    
    # Calculate Streak
    today = timezone.now().date()
    streak = 0
    
    # Get dates of all quizzes taken by user, distinct and ordered
    quiz_dates = Quiz.objects.filter(user=user).dates('timestamp', 'day', order='DESC')
    
    if quiz_dates:
        # Check if user practiced today or yesterday to keep streak alive
        last_practice = quiz_dates[0]
        if last_practice == today or last_practice == today - timedelta(days=1):
            streak = 1
            current_date = last_practice
            
            # Iterate backwards to find consecutive days
            for i in range(1, len(quiz_dates)):
                prev_date = quiz_dates[i]
                if prev_date == current_date - timedelta(days=1):
                    streak += 1
                    current_date = prev_date
                else:
                    break
    
    # Calculate Level based on mastered words
    if mastered_words_count < 50:
        level = "Novice"
    elif mastered_words_count < 150:
        level = "A1 - Beginner"
    elif mastered_words_count < 300:
        level = "A2 - Elementary"
    elif mastered_words_count < 600:
        level = "B1 - Intermediate"
    elif mastered_words_count < 1200:
        level = "B2 - Upper Intermediate"
    else:
        level = "C1 - Advanced"

    # Calculate Trends (Last 7 days)
    seven_days_ago = timezone.now() - timedelta(days=7)
    words_added_this_week = Vocabulary.objects.filter(created_by=user, created_at__gte=seven_days_ago).count()
    quizzes_this_week = Quiz.objects.filter(user=user, timestamp__gte=seven_days_ago).count()
    
    # Calculate Stats based on HLR
    needs_review = 0
    learning_words = 0
    mastered_words = 0
    
    now = timezone.now()
    all_vocab = Vocabulary.objects.filter(created_by=user)
    
    for word in all_vocab:
        if not word.last_practiced_at:
            # New words are not counted in any of these categories for the dashboard summary
            # or maybe they should be in 'learning'? Let's keep them separate or just ignore for now.
            continue
            
        days_since = (now - word.last_practiced_at).days
        recall_prob = HLRScheduler.predict_recall_probability(
            word.correct_count,
            word.wrong_count,
            word.total_practice_count,
            days_since
        )
        
        # Mastery Definition:
        # 1. Practiced at least 3 times
        # 2. Recall Probability > 90%
        is_mastered = word.total_practice_count >= 3 and recall_prob > 0.9
        
        if is_mastered:
            mastered_words += 1
        elif recall_prob < 0.5:
            needs_review += 1
        else:
            learning_words += 1

    # Activity Log (Last 365 days) for Heatmap
    # Group quizzes by date and count them
    one_year_ago = now - timedelta(days=365)
    
    # Get all quizzes in the last year
    # We use TruncDate to group by day
    
    daily_activity = Quiz.objects.filter(
        user=user, 
        timestamp__gte=one_year_ago
    ).annotate(
        date=TruncDate('timestamp')
    ).values('date').annotate(
        count=Count('id')
    ).order_by('date')
    
    # Convert to dictionary { 'YYYY-MM-DD': count }
    activity_log = {}
    for entry in daily_activity:
        date_str = entry['date'].strftime('%Y-%m-%d')
        activity_log[date_str] = entry['count']
    
    return Response({
        'total_words': total_words,
        'mastered_words': mastered_words,
        'learning_words': learning_words,
        'needs_review': needs_review,
        'streak': streak,
        'level': level,
        'words_added_this_week': words_added_this_week,
        'quizzes_this_week': quizzes_this_week,
        'activity_log': activity_log
    })
