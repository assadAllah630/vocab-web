from rest_framework import viewsets, status, permissions, filters, pagination
from rest_framework.decorators import api_view, permission_classes, authentication_classes, action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from .models import Vocabulary, UserProgress, Quiz, Tag, UserProfile, UserRelationship
from .serializers import VocabularySerializer, UserProgressSerializer, QuizSerializer, UserSerializer, UserProfileSerializer, UserRelationshipSerializer
from .srs import calculate_srs
from datetime import timedelta
from django.utils import timezone
from django.utils import timezone
from django.db.models import Q
from django.http import HttpResponse
import csv
import io
import google.generativeai as genai
import json
from .prompts import ContextEngineer

from django_ratelimit.decorators import ratelimit

@api_view(['POST'])
@authentication_classes([])  # Disable authentication for signup
@permission_classes([permissions.AllowAny])
@ratelimit(key='ip', rate='20/h', block=True)  # Increased for development
def signup(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')
    native_language = request.data.get('native_language', 'en')
    target_language = request.data.get('target_language', 'de')

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

    # Create user but keep inactive until verified (optional, or just use is_email_verified)
    user = User.objects.create_user(username=username, password=password, email=email)
    user.is_active = True # We'll use is_email_verified flag instead of deactivating
    user.save()

    # Profile setup
    if hasattr(user, 'profile'):
        profile = user.profile
        profile.native_language = native_language
        profile.target_language = target_language
        profile.is_email_verified = False
        profile.save()
    else:
        UserProfile.objects.create(
            user=user, 
            native_language=native_language, 
            target_language=target_language,
            is_email_verified=False
        )
    
    # Generate OTP
    import random
    otp = f"{random.randint(100000, 999999)}"
    user.profile.otp_code = otp
    user.profile.otp_created_at = timezone.now()
    user.profile.save()
    
    # Send Email (Console Backend)
    from django.core.mail import send_mail
    try:
        send_mail(
            'Verify your Vocabulary App Account',
            f'Your verification code is: {otp}',
            'noreply@vocabapp.com',
            [email],
            fail_silently=False,
        )
    except Exception as e:
        print(f"Failed to send email: {e}")
        # In dev, we can just print it
        print(f"DEBUG OTP: {otp}")

    return Response({
        'message': 'Account created. Please verify your email.',
        'email': email
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@ratelimit(key='ip', rate='10/h', block=True)
def verify_email(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
    profile = user.profile
    
    # Check if already verified
    if profile.is_email_verified:
        return Response({'message': 'Email already verified'}, status=status.HTTP_200_OK)
        
    # Check OTP
    if profile.otp_code != otp:
        return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
        
    # Check Expiration (e.g., 10 mins)
    time_diff = timezone.now() - profile.otp_created_at
    if time_diff.total_seconds() > 600: # 10 minutes
        return Response({'error': 'OTP expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)
        
    # Verify
    profile.is_email_verified = True
    profile.otp_code = None # Clear OTP
    profile.save()
    
    # Auto Login
    login(request, user)
    return Response(UserSerializer(user).data)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@ratelimit(key='ip', rate='5/h', block=True)
def resend_otp(request):
    email = request.data.get('email')
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if user.profile.is_email_verified:
        return Response({'message': 'Email already verified'}, status=status.HTTP_200_OK)
        
    # Generate New OTP
    import random
    otp = f"{random.randint(100000, 999999)}"
    user.profile.otp_code = otp
    user.profile.otp_created_at = timezone.now()
    user.profile.save()
    
    # Send Email
    from django.core.mail import send_mail
    try:
        send_mail(
            'Verify your Vocabulary App Account',
            f'Your new verification code is: {otp}',
            'noreply@vocabapp.com',
            [email],
            fail_silently=False,
        )
    except Exception as e:
        print(f"Failed to send email: {e}")
        print(f"DEBUG OTP: {otp}")
        
    return Response({'message': 'OTP resent successfully'})

@api_view(['POST'])
@authentication_classes([])  # Disable authentication/CSRF for this endpoint
@permission_classes([permissions.AllowAny])
@ratelimit(key='ip', rate='5/m', block=True)
def signin(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        
        # Debug logging
        print(f"Signin attempt for username: {username}")
        
        user = authenticate(username=username, password=password)
        
        if user:
            if not hasattr(user, 'profile'):
                UserProfile.objects.create(user=user)
                
            if not user.profile.is_email_verified:
                # Trigger OTP flow if not verified
                # For now, we'll just block login and ask to verify
                # Ideally, we should trigger resend_otp here if needed
                return Response({
                    'error': 'Email not verified', 
                    'email': user.email,
                    'requires_verification': True
                }, status=status.HTTP_403_FORBIDDEN)
                
            login(request, user)
            return Response(UserSerializer(user).data)
            
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in signin: {error_details}")
        return Response({
            'error': 'Internal Server Error',
            'details': str(e),
            'traceback': error_details
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def enrich_vocabulary_with_ai(vocab, api_key):
    if not api_key:
        return

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Get user languages
        try:
            profile = vocab.created_by.profile
            native_lang_code = profile.native_language
            target_lang_code = profile.target_language
        except UserProfile.DoesNotExist:
            native_lang_code = 'en'
            target_lang_code = 'de'

        context_engineer = ContextEngineer(native_lang_code, target_lang_code)
        prompt = context_engineer.get_enrichment_prompt(vocab.word, vocab.type, vocab.translation)
        
        response = model.generate_content(prompt)
        # Clean response text to ensure valid JSON
        text = response.text.strip()
        if text.startswith('```json'):
            text = text[7:]
        if text.endswith('```'):
            text = text[:-3]
        
        data = json.loads(text)
        
        # Tags
        for tag_name in data.get('tags', []):
            tag, _ = Tag.objects.get_or_create(name=tag_name.lower(), user=vocab.created_by)
            vocab.tags.add(tag)
            
        # Synonyms & Antonyms (Merge with existing)
        existing_synonyms = set(vocab.synonyms)
        existing_synonyms.update(data.get('synonyms', []))
        vocab.synonyms = list(existing_synonyms)
        
        existing_antonyms = set(vocab.antonyms)
        existing_antonyms.update(data.get('antonyms', []))
        vocab.antonyms = list(existing_antonyms)
        
        # Related Words (Smart Linking)
        # Find existing words in DB that match related concepts
        related_concepts = data.get('related_concepts', [])
        
        # Save abstract concepts to JSON field
        vocab.related_concepts = related_concepts
        
        for concept in related_concepts:
            related_vocab = Vocabulary.objects.filter(
                created_by=vocab.created_by, 
                word__iexact=concept
            ).first()
            if related_vocab:
                vocab.related_words.add(related_vocab)
        
        vocab.save()
        
    except Exception as e:
        print(f"AI Enrichment Failed: {e}")
        # Graceful degradation - do nothing

class StandardResultsSetPagination(pagination.PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class VocabularyViewSet(viewsets.ModelViewSet):
    serializer_class = VocabularySerializer
    permission_classes = [permissions.IsAuthenticated]
    # pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['word', 'created_at', 'type', 'last_seen']
    ordering = ['-created_at']  # Default ordering

    def get_queryset(self):
        # Filter by user's target language
        try:
            target_lang = self.request.user.profile.target_language
        except UserProfile.DoesNotExist:
            target_lang = 'de'

        queryset = Vocabulary.objects.filter(created_by=self.request.user, language=target_lang)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(Q(word__icontains=search) | Q(translation__icontains=search))
            
        # Tag
        tag = self.request.query_params.get('tag')
        if tag:
            queryset = queryset.filter(tags__name=tag)
            
        # Type
        type_filter = self.request.query_params.get('type')
        if type_filter:
            queryset = queryset.filter(type=type_filter)
            
        return queryset

    def _generate_embedding_for_vocab(self, vocab, request):
        """Helper to generate embedding for a vocabulary item."""
        api_key = request.headers.get('X-OpenRouter-Key')
        if not api_key:
            return
            
        try:
            from .embedding_service import EmbeddingService
            import threading
            
            def generate_and_save():
                try:
                    # Simplified format: "Word Translation"
                    # This proved to be much more effective for semantic search than including examples/synonyms
                    text = f"{vocab.word} {vocab.translation}"
                        
                    embedding = EmbeddingService.generate_embedding(text, api_key)
                    vocab.embedding = embedding
                    vocab.save(update_fields=['embedding'])
                except Exception as e:
                    print(f"Failed to auto-generate embedding for {vocab.word}: {e}")
            
            # Run in background thread
            thread = threading.Thread(target=generate_and_save)
            thread.start()
        except Exception as e:
            print(f"Error initiating embedding generation: {e}")

    def perform_create(self, serializer):
        # Set language to user's target language
        try:
            target_lang = self.request.user.profile.target_language
        except UserProfile.DoesNotExist:
            target_lang = 'de'
            
        vocab = serializer.save(created_by=self.request.user, language=target_lang)
        
        # Trigger AI Enrichment
        gemini_key = self.request.headers.get('X-Gemini-Key')
        if gemini_key:
            # Use background thread for AI enrichment
            import threading
            thread = threading.Thread(target=enrich_vocabulary_with_ai, args=(vocab, gemini_key))
            thread.start()
            
        # Trigger Embedding Generation
        self._generate_embedding_for_vocab(vocab, self.request)

    def perform_update(self, serializer):
        vocab = serializer.save()
        # Trigger Embedding Generation on update
        self._generate_embedding_for_vocab(vocab, self.request)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="vocabulary_export_{timezone.now().date()}.csv"'

        writer = csv.writer(response)
        writer.writerow(['Word', 'Translation', 'Type', 'Example', 'Tags', 'Synonyms', 'Antonyms', 'Created At'])

        vocab_list = self.get_queryset()
        for vocab in vocab_list:
            tags = ", ".join([t.name for t in vocab.tags.all()])
            synonyms = ", ".join(vocab.synonyms)
            antonyms = ", ".join(vocab.antonyms)
            writer.writerow([vocab.word, vocab.translation, vocab.type, vocab.example, tags, synonyms, antonyms, vocab.created_at])

        return response

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def import_csv(self, request):
        """
        Import Vocabulary from CSV
        CSV Format: word, translation, type, example, tags (comma-separated), synonyms (comma-separated), antonyms (comma-separated)
        """
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Use utf-8-sig to handle BOM from Excel
            decoded_file = file_obj.read().decode('utf-8-sig')
            io_string = io.StringIO(decoded_file)
            
            # Read CSV and normalize headers
            reader = csv.DictReader(io_string)
            
            # Normalize headers (strip whitespace, lowercase)
            # This is a bit tricky with DictReader as it reads headers immediately.
            # Instead, we'll handle key lookups robustly.
            
            created_count = 0
            errors = []
            
            # Get user's target language for import
            try:
                target_lang = request.user.profile.target_language
            except UserProfile.DoesNotExist:
                target_lang = 'de'
            
            for row in reader:
                try:
                    # Parse tags
                    tags_str = row.get('tags', '') or row.get('Tags', '')
                    tag_names = [t.strip() for t in tags_str.split(',') if t.strip()]
                    
                    # Parse synonyms and antonyms
                    synonyms_str = row.get('synonyms', '') or row.get('Synonyms', '')
                    synonyms = [s.strip() for s in synonyms_str.split(',') if s.strip()]
                    
                    antonyms_str = row.get('antonyms', '') or row.get('Antonyms', '')
                    antonyms = [a.strip() for a in antonyms_str.split(',') if a.strip()]

                    # Check for duplicates
                    word_text = row.get('word') or row.get('Word')
                    if not word_text:
                        continue
                        
                    # Skip if word already exists for this user and language
                    if Vocabulary.objects.filter(word__iexact=word_text, created_by=request.user, language=target_lang).exists():
                        continue
                    
                    # Create vocabulary
                    vocab = Vocabulary.objects.create(
                        word=word_text,
                        translation=row.get('translation') or row.get('Translation'),
                        type=row.get('type') or row.get('Type', 'other'),
                        example=row.get('example', '') or row.get('Example', ''),
                        synonyms=synonyms,
                        antonyms=antonyms,
                        created_by=request.user,
                        language=target_lang
                    )
                    
                    # Add tags
                    for tag_name in tag_names:
                        tag, _ = Tag.objects.get_or_create(name=tag_name, user=request.user)
                        vocab.tags.add(tag)
                    
                    created_count += 1
                except Exception as e:
                    errors.append(f"Error importing row {row.get('word', 'unknown')}: {str(e)}")
            
            return Response({
                'message': f'Successfully imported {created_count} words',
                'errors': errors
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PublicVocabularyViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = VocabularySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        try:
            target_lang = self.request.user.profile.target_language
        except UserProfile.DoesNotExist:
            target_lang = 'de'
            
        return Vocabulary.objects.filter(is_public=True, language=target_lang).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def copy(self, request, pk=None):
        vocab = self.get_object()
        # Check if user already has this word
        if Vocabulary.objects.filter(created_by=request.user, word=vocab.word).exists():
            return Response({'error': 'You already have this word in your collection'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create copy
        new_vocab = Vocabulary.objects.create(
            word=vocab.word,
            translation=vocab.translation,
            example=vocab.example,
            type=vocab.type,
            created_by=request.user,
            is_public=False # Private by default when copied
        )
        # Copy tags
        for tag in vocab.tags.all():
            # Create new tag for user if not exists, or link existing
            user_tag, _ = Tag.objects.get_or_create(name=tag.name, user=request.user)
            new_vocab.tags.add(user_tag)
            
        return Response(VocabularySerializer(new_vocab).data, status=status.HTTP_201_CREATED)

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

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_statistics(request):
    user = request.user
    total_words = Vocabulary.objects.filter(created_by=user).count()
    mastered_words = UserProgress.objects.filter(user=user, repetition_stage__gte=4).count()
    learning_words = UserProgress.objects.filter(user=user, repetition_stage__gt=0, repetition_stage__lt=4).count()
    
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
    if mastered_words < 50:
        level = "Novice"
    elif mastered_words < 150:
        level = "A1 - Beginner"
    elif mastered_words < 300:
        level = "A2 - Elementary"
    elif mastered_words < 600:
        level = "B1 - Intermediate"
    elif mastered_words < 1200:
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
    from django.db.models.functions import TruncDate
    from django.db.models import Count
    
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

class QuizViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Quiz.objects.filter(user=self.request.user).order_by('-timestamp')

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_profile(request):
    user = request.user
    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=user)
    
    native_lang = request.data.get('native_language')
    target_lang = request.data.get('target_language')
    
    if native_lang:
        profile.native_language = native_lang
    if target_lang:
        profile.target_language = target_lang
        
    profile.save()
    return Response(UserSerializer(user).data)

class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

    def get_object(self):
        return self.request.user.profile

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user.profile)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def public(self, request):
        username = request.query_params.get('username')
        if not username:
            return Response({'error': 'Username required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(username=username)
            serializer = self.get_serializer(user.profile)
            
            # Add follow status
            data = serializer.data
            data['is_following'] = UserRelationship.objects.filter(follower=request.user, following=user).exists()
            data['followers_count'] = user.followers.count()
            data['following_count'] = user.following.count()
            
            return Response(data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class UserSearchView(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if len(query) < 3:
            return UserProfile.objects.none()
        return UserProfile.objects.filter(user__username__icontains=query).exclude(user=self.request.user)[:10]

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def follow_user(request):
    username = request.data.get('username')
    action = request.data.get('action', 'follow') # follow or unfollow
    
    try:
        target_user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if target_user == request.user:
        return Response({'error': 'Cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)
        
    if action == 'follow':
        UserRelationship.objects.get_or_create(follower=request.user, following=target_user)
        return Response({'status': 'following'})
    else:
        UserRelationship.objects.filter(follower=request.user, following=target_user).delete()
        return Response({'status': 'unfollowed'})

from .models import Exam
from .serializers import ExamSerializer

class ExamViewSet(viewsets.ModelViewSet):
    serializer_class = ExamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter by user and language
        try:
            target_lang = self.request.user.profile.target_language
        except UserProfile.DoesNotExist:
            target_lang = 'de'
            
        return Exam.objects.filter(user=self.request.user, language=target_lang).prefetch_related('attempts').order_by('-updated_at')

    @action(detail=False, methods=['get'])
    def community(self, request):
        """Get public exams from people I follow"""
        try:
            target_lang = request.user.profile.target_language
        except UserProfile.DoesNotExist:
            target_lang = 'de'
            
        following_ids = UserRelationship.objects.filter(follower=request.user).values_list('following_id', flat=True)
        
        exams = Exam.objects.filter(
            user_id__in=following_ids, 
            language=target_lang,
            is_public=True
        ).prefetch_related('attempts', 'user__profile').order_by('-created_at')
        
        page = self.paginate_queryset(exams)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(exams, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def public_user_exams(self, request):
        """Get public exams for a specific user"""
        username = request.query_params.get('username')
        try:
            target_user = User.objects.get(username=username)
            exams = Exam.objects.filter(
                user=target_user,
                is_public=True
            ).prefetch_related('attempts').order_by('-created_at')
            
            serializer = self.get_serializer(exams, many=True)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def create(self, request, *args, **kwargs):
        try:
            target_lang = request.user.profile.target_language
        except UserProfile.DoesNotExist:
            target_lang = 'de'
        
        topic = request.data.get('topic')
        difficulty = request.data.get('difficulty')
        questions = request.data.get('questions')
        user_answers = request.data.get('user_answers', {})
        feedback = request.data.get('feedback', {})
        score = request.data.get('score', 0)
        
        # Try to find existing exam with same topic, difficulty, and questions
        from django.db.models import Q
        import json
        
        existing_exam = Exam.objects.filter(
            user=request.user,
            language=target_lang,
            topic=topic,
            difficulty=difficulty
        ).first()
        
        # Check if questions match (simple comparison)
        if existing_exam and json.dumps(existing_exam.questions, sort_keys=True) == json.dumps(questions, sort_keys=True):
            # This is a retake - create new attempt
            from .models import ExamAttempt
            attempt = ExamAttempt.objects.create(
                exam=existing_exam,
                user_answers=user_answers,
                feedback=feedback,
                score=score
            )
            
            # Update exam stats
            existing_exam.attempt_count += 1
            if score > existing_exam.best_score:
                existing_exam.best_score = score
            existing_exam.save()
            
            serializer = self.get_serializer(existing_exam)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            # New exam - create exam and first attempt
            exam = Exam.objects.create(
                user=request.user,
                language=target_lang,
                topic=topic,
                difficulty=difficulty,
                questions=questions,
                best_score=score,
                attempt_count=1
            )
            
            from .models import ExamAttempt
            ExamAttempt.objects.create(
                exam=exam,
                user_answers=user_answers,
                feedback=feedback,
                score=score
            )
            
            serializer = self.get_serializer(exam)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

# HLR Practice Endpoints
from .hlr import HLRScheduler
from django.db.models import F

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

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_vocab_by_status(request):
    """
    Get vocabulary filtered by HLR status: 'new', 'learning', 'mastered'.
    """
    status_param = request.query_params.get('status', 'new')
    user = request.user
    
    try:
        target_lang = user.profile.target_language
    except UserProfile.DoesNotExist:
        target_lang = 'de'
        
    queryset = Vocabulary.objects.filter(created_by=user, language=target_lang)
    
    filtered_vocab = []
    now = timezone.now()
    
    for word in queryset:
        # Determine status
        if not word.last_practiced_at:
            status = 'new'
            recall_prob = 0.0
        else:
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
                status = 'mastered'
            elif recall_prob < 0.5:
                status = 'new' # "Needs Review" is grouped with New/Weak
            else:
                status = 'learning'
        
        # Filter
        if status == status_param:
            # Add recall_prob to the serialized data for the frontend WiFi signal
            data = VocabularySerializer(word).data
            data['recall_probability'] = recall_prob
            filtered_vocab.append(data)
            
    # Sort by recall probability (ascending for new/learning, descending for mastered)
    if status_param == 'mastered':
        filtered_vocab.sort(key=lambda x: x['recall_probability'], reverse=True)
    else:
        filtered_vocab.sort(key=lambda x: x['recall_probability'])
        
    return Response(filtered_vocab)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """
    Health check endpoint for monitoring.
    Returns 200 if application is healthy, 503 if not.
    """
    from django.db import connection
    
    health_status = {
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'checks': {}
    }
    
    # Check database connectivity
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status['checks']['database'] = 'ok'
    except Exception as e:
        health_status['status'] = 'unhealthy'
        health_status['checks']['database'] = f'error: {str(e)}'
        return Response(health_status, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    # Check cache (if configured)
    try:
        from django.core.cache import cache
        cache.set('health_check', 'ok', 10)
        if cache.get('health_check') == 'ok':
            health_status['checks']['cache'] = 'ok'
        else:
            health_status['checks']['cache'] = 'degraded'
    except:
        health_status['checks']['cache'] = 'not_configured'
    
    return Response(health_status, status=status.HTTP_200_OK)

