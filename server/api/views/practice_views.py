from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from ..models import Vocabulary, UserProgress, Quiz, UserProfile
from ..serializers import UserProgressSerializer, QuizSerializer, VocabularySerializer
from ..srs import calculate_srs
from ..hlr import HLRScheduler
from datetime import timedelta
from django.utils import timezone
from django.db import transaction

class UserProgressViewSet(viewsets.ModelViewSet):
    serializer_class = UserProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserProgress.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_progress(request):
    vocab_id = request.data.get('vocab_id')
    correct = request.data.get('correct')
    grade = request.data.get('grade') # Optional 0-5 grade
    
    vocab = Vocabulary.objects.get(id=vocab_id)
    progress, created = UserProgress.objects.get_or_create(user=request.user, vocab=vocab)
    
    # Fallback if grade not provided
    if grade is None:
        grade = 5 if correct else 0
    
    srs_data = calculate_srs(grade, progress.repetition_stage, progress.easiness_factor, progress.interval)
    
    progress.repetition_stage = srs_data['repetitions']
    progress.easiness_factor = srs_data['easiness_factor']
    progress.interval = srs_data['interval']
    progress.next_review_date = timezone.now() + timedelta(days=progress.interval)
    
    if grade < 3:
        progress.mistakes += 1
        
    progress.save()
    
    # Save Quiz Result
    Quiz.objects.create(user=request.user, vocab=vocab, score=grade * 2)
    
    return Response(UserProgressSerializer(progress).data)

class QuizViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Quiz.objects.filter(user=self.request.user).order_by('-timestamp')

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_words_for_practice(request):
    """
    Get words prioritized by HLR (lowest recall probability first).
    Includes new words (never practiced) at the end.
    """
    user = request.user
    limit = int(request.query_params.get('limit', 20))
    
    try:
        target_lang = user.profile.target_language
    except UserProfile.DoesNotExist:
        target_lang = 'de'
        
    # Get all words for user and language
    queryset = Vocabulary.objects.filter(created_by=user, language=target_lang)
    
    # Calculate priority for each word
    # Note: For large datasets, this should be done in DB or cached.
    # Given the constraints, we'll do it in Python for now as requested "simple integration".
    
    # --- SMART SESSION MIX ALGORITHM ---
    # Goal: 20% New Words, 80% Due Reviews (Recall < 90%)
    # This prevents "New Word Starvation" and ensures steady progress.
    
    due_words = []      # Recall < 0.9
    new_words = []      # Never practiced
    mastered_words = [] # Recall >= 0.9 (Review Ahead)
    
    now = timezone.now()
    
    for word in queryset:
        if not word.last_practiced_at:
            new_words.append(word)
        else:
            days_since = (now - word.last_practiced_at).days
            recall_prob = HLRScheduler.predict_recall_probability(
                word.correct_count,
                word.wrong_count,
                word.total_practice_count,
                days_since
            )
            
            # Store tuple: (recall_prob, word, days_since)
            if recall_prob < 0.9:
                due_words.append((recall_prob, word, days_since))
            else:
                mastered_words.append((recall_prob, word, days_since))
                
    # Sort lists
    # Due: Lowest recall first (Urgent)
    due_words.sort(key=lambda x: x[0])
    
    # Mastered: Lowest recall first (Closest to being due)
    mastered_words.sort(key=lambda x: x[0])
    
    # New: Oldest created first (FIFO) or Random? Let's do Random for variety
    import random
    random.shuffle(new_words)
    
    # Allocations
    target_new = int(limit * 0.2) # 20% = 4 words
    target_due = limit - target_new # 80% = 16 words
    
    final_selection = []
    
    # 1. Select New Words (up to target)
    selected_new = new_words[:target_new]
    final_selection.extend(selected_new)
    
    # 2. Select Due Words (up to target)
    selected_due = [w for p, w, d in due_words[:target_due]]
    final_selection.extend(selected_due)
    
    # 3. Backfill if we have space (didn't meet targets)
    remaining_slots = limit - len(final_selection)
    
    if remaining_slots > 0:
        # Try to fill with more Due words
        remaining_due = [w for p, w, d in due_words[target_due:]]
        fill_due = remaining_due[:remaining_slots]
        final_selection.extend(fill_due)
        remaining_slots -= len(fill_due)
        
    if remaining_slots > 0:
        # Try to fill with more New words
        remaining_new = new_words[target_new:]
        fill_new = remaining_new[:remaining_slots]
        final_selection.extend(fill_new)
        remaining_slots -= len(fill_new)
        
    if remaining_slots > 0:
        # Finally, fill with Mastered (Review Ahead)
        fill_mastered = [w for p, w, d in mastered_words[:remaining_slots]]
        final_selection.extend(fill_mastered)
        
    # Shuffle the final session so user gets a mix
    random.shuffle(final_selection)
    
    practice_words = final_selection
    
    # Enhance response with HLR statistics
    response_data = []
    for word in practice_words:
        word_data = VocabularySerializer(word).data
        
        # Add HLR statistics
        if word.last_practiced_at:
            days_since = (now - word.last_practiced_at).days
            half_life = HLRScheduler.estimate_half_life(
                word.correct_count,
                word.wrong_count,
                word.total_practice_count
            )
            recall_prob = HLRScheduler.predict_recall_probability(
                word.correct_count,
                word.wrong_count,
                word.total_practice_count,
                days_since
            )
            priority = HLRScheduler.get_priority_score(
                word.correct_count,
                word.wrong_count,
                word.total_practice_count,
                days_since
            )
            
            word_data['hlr_stats'] = {
                'recall_probability': round(recall_prob, 4),
                'half_life': round(half_life, 2),
                'days_since_practice': days_since,
                'priority_score': round(priority, 4),
                'correct_count': word.correct_count,
                'wrong_count': word.wrong_count,
                'total_practice_count': word.total_practice_count
            }
        else:
            # New word - never practiced
            word_data['hlr_stats'] = {
                'recall_probability': 0.0,
                'half_life': 0.0,
                'days_since_practice': None,
                'priority_score': 0.5,
                'correct_count': 0,
                'wrong_count': 0,
                'total_practice_count': 0
            }
        
        response_data.append(word_data)
    
    return Response(response_data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def record_practice_result(request):
    """
    Record practice result and update HLR stats with Hybrid SM-2 Feedback.
    Accepts 'difficulty': 'again', 'hard', 'good', 'easy'.
    Legacy support for 'was_correct' boolean.
    """
    word_id = request.data.get('word_id')
    difficulty = request.data.get('difficulty') # 'again', 'hard', 'good', 'easy'
    was_correct = request.data.get('was_correct') # Legacy fallback
    
    if not word_id:
        return Response({'error': 'Missing word_id'}, status=status.HTTP_400_BAD_REQUEST)
    
    # FIX: Use transaction and select_for_update to prevent race conditions
    from django.db import transaction
    
    try:
        with transaction.atomic():
            # Lock the row for update to prevent concurrent modifications
            word = Vocabulary.objects.select_for_update().get(
                id=word_id, 
                created_by=request.user
            )
            
            # Map difficulty to HLR weights
            # HLR uses correct_count and wrong_count to estimate half-life.
            # We can tweak these to simulate "Ease" and "Difficulty".
            
            score = 0 # For Quiz log
            
            if difficulty:
                if difficulty == 'again':
                    word.wrong_count += 1
                    score = 0
                elif difficulty == 'hard':
                    # Hard: You remembered it, but it was a struggle.
                    # We treat this as Correct (+1) but also add a "Wrong" (+1) penalty 
                    # to prevent the half-life from growing too fast (Stability stays roughly same).
                    word.correct_count += 1
                    word.wrong_count += 1 
                    score = 50
                elif difficulty == 'good':
                    # Standard Correct
                    word.correct_count += 1
                    score = 100
                elif difficulty == 'easy':
                    # Easy: You know this perfectly.
                    # Double stability boost.
                    word.correct_count += 2
                    score = 150
            elif was_correct is not None:
                # Legacy fallback
                if was_correct:
                    word.correct_count += 1
                    score = 100
                else:
                    word.wrong_count += 1
                    score = 0
            else:
                return Response({'error': 'Missing result data'}, status=status.HTTP_400_BAD_REQUEST)
                
            word.total_practice_count += 1
            word.last_practiced_at = timezone.now()
            word.save()
            
            # Log activity for Heatmap (create Quiz entry)
            Quiz.objects.create(user=request.user, vocab=word, score=score)
            
    except Vocabulary.DoesNotExist:
        return Response({'error': 'Word not found'}, status=status.HTTP_404_NOT_FOUND)
    
    return Response({'status': 'success', 'word_id': word.id, 'difficulty': difficulty})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_random_words(request):
    """
    Get 20 random words for non-HLR practice.
    """
    count = Vocabulary.objects.filter(created_by=request.user).count()
    limit = 20
    
    if count == 0:
        return Response([])
        
    # Efficient random selection
    if count <= limit:
        queryset = Vocabulary.objects.filter(created_by=request.user)
    else:
        # Get random IDs
        import random
        all_ids = list(Vocabulary.objects.filter(created_by=request.user).values_list('id', flat=True))
        random_ids = random.sample(all_ids, limit)
        queryset = Vocabulary.objects.filter(id__in=random_ids)
        
    serializer = VocabularySerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_matching_game_words(request):
    """
    Get 8 random words for the Memory Match game (Total 16 cards).
    """
    count = Vocabulary.objects.filter(created_by=request.user).count()
    limit = 8 # 8 pairs = 16 cards
    
    if count < limit:
        # If not enough words, return what we have
        queryset = Vocabulary.objects.filter(created_by=request.user)
    else:
        import random
        all_ids = list(Vocabulary.objects.filter(created_by=request.user).values_list('id', flat=True))
        random_ids = random.sample(all_ids, limit)
        queryset = Vocabulary.objects.filter(id__in=random_ids)
        
    serializer = VocabularySerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_review_stats(request):
    """
    Get review statistics based on HLR recall probability.
    """
    user = request.user
    try:
        target_lang = user.profile.target_language
    except UserProfile.DoesNotExist:
        target_lang = 'de'
        
    queryset = Vocabulary.objects.filter(created_by=user, language=target_lang)
    
    needs_review = 0
    learning = 0
    mastered = 0
    new_words = 0
    
    now = timezone.now()
    
    for word in queryset:
        if not word.last_practiced_at:
            new_words += 1
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
            mastered += 1
        elif recall_prob < 0.5:
            needs_review += 1
        else:
            learning += 1
            
    return Response({
        'needs_review': needs_review,
        'learning': learning,
        'mastered': mastered,
        'new_words': new_words
    })
