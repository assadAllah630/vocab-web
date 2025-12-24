from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import Exam, ExamAttempt, UserProfile, UserRelationship, User
from ..serializers import ExamSerializer
from django.db.models import Q
import json
from ..services.learning_events import log_exam_attempt

class ExamViewSet(viewsets.ModelViewSet):
    serializer_class = ExamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter by user and language pair
        try:
            profile = self.request.user.profile
            target_lang = profile.target_language
            native_lang = profile.native_language
        except UserProfile.DoesNotExist:
            target_lang = 'de'
            native_lang = 'en'
            
        return Exam.objects.filter(
            user=self.request.user, 
            language=target_lang,
            native_language=native_lang
        ).prefetch_related('attempts').order_by('-updated_at')

    @action(detail=False, methods=['get'])
    def community(self, request):
        """Get public exams from people I follow"""
        try:
            profile = request.user.profile
            target_lang = profile.target_language
            native_lang = profile.native_language
        except UserProfile.DoesNotExist:
            target_lang = 'de'
            native_lang = 'en'
            
        following_ids = UserRelationship.objects.filter(follower=request.user).values_list('following_id', flat=True)
        
        exams = Exam.objects.filter(
            user_id__in=following_ids, 
            language=target_lang,
            native_language=native_lang,
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
            profile = request.user.profile
            target_lang = profile.target_language
            native_lang = profile.native_language
        except UserProfile.DoesNotExist:
            target_lang = 'de'
            native_lang = 'en'
        
        topic = request.data.get('topic')
        difficulty = request.data.get('difficulty')
        questions = request.data.get('questions')
        user_answers = request.data.get('user_answers', {})
        feedback = request.data.get('feedback', {})
        score = request.data.get('score', 0)
        
        # Try to find existing exam with same topic, difficulty, language pair, and questions
        
        # Check if creating a template
        is_template = request.data.get('is_template', False)
        
        # Try to find existing exam with same topic, difficulty, language pair, and questions
        # ONLY if not a template (templates should be unique versions)
        
        existing_exam = None
        if not is_template:
            existing_exam = Exam.objects.filter(
                user=request.user,
                language=target_lang,
                native_language=native_lang,
                topic=topic,
                difficulty=difficulty
            ).first()
        
        # Check if questions match (simple comparison)
        if existing_exam and json.dumps(existing_exam.questions, sort_keys=True) == json.dumps(questions, sort_keys=True):
            # This is a retake - create new attempt
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
            
            # Log Learning Event
            log_exam_attempt(request.user, existing_exam.id, score)

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            # New exam - create exam and first attempt with language pair
            # For templates, we don't create an attempt
            exam = Exam.objects.create(
                user=request.user,
                language=target_lang,
                native_language=native_lang,
                topic=topic,
                difficulty=difficulty,
                questions=questions,
                best_score=score if not is_template else 0,
                attempt_count=1 if not is_template else 0,
                is_template=is_template
            )
            
            if not is_template:
                ExamAttempt.objects.create(
                    exam=exam,
                    user_answers=user_answers,
                    feedback=feedback,
                    score=score
                )
                # Log Learning Event only for real attempts
                log_exam_attempt(request.user, exam.id, score)
            
            serializer = self.get_serializer(exam)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def get_template(self, request, pk=None):
        """Fetch a template exam's structure without creating an attempt."""
        exam = self.get_object()
        serializer = self.get_serializer(exam)
        return Response(serializer.data)
