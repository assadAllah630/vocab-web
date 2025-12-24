from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ..models import GameConfig, GameSession, GameParticipant, Classroom
from ..permissions import IsTeacher


class GameConfigViewSet(viewsets.ModelViewSet):
    """
    CRUD for game configurations (teacher only).
    """
    permission_classes = [IsAuthenticated, IsTeacher]
    
    def get_queryset(self):
        return GameConfig.objects.filter(teacher=self.request.user.teacher_profile)
    
    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user.teacher_profile)
    
    def list(self, request):
        configs = self.get_queryset()
        data = [{
            'id': c.id,
            'name': c.name,
            'mode': c.mode,
            'mode_display': c.get_mode_display(),
            'content_source': c.content_source,
            'created_at': c.created_at,
        } for c in configs]
        return Response(data)
    
    def create(self, request):
        data = request.data
        config = GameConfig.objects.create(
            teacher=request.user.teacher_profile,
            name=data.get('name', 'Untitled Game'),
            mode=data.get('mode', 'velocity'),
            content_source=data.get('content_source', 'exam'),
            content_id=data.get('content_id'),
            custom_questions=data.get('custom_questions', []),
            stages=data.get('stages', []),
            settings=data.get('settings', {}),
        )
        return Response({'id': config.id, 'name': config.name}, status=status.HTTP_201_CREATED)


class GameSessionViewSet(viewsets.ModelViewSet):
    """
    Game session management for teachers and students.
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Teachers see sessions they host, students see sessions they're in
        if hasattr(user, 'teacher_profile'):
            return GameSession.objects.filter(host=user)
        return GameSession.objects.filter(
            participant_records__user=user
        ).distinct()
    
    def list(self, request):
        sessions = self.get_queryset().order_by('-created_at')[:20]
        data = [{
            'id': s.id,
            'join_code': s.join_code,
            'classroom': s.classroom.name,
            'status': s.status,
            'participant_count': s.participant_records.count(),
            'created_at': s.created_at,
        } for s in sessions]
        return Response(data)
    
    def create(self, request):
        """Teacher creates a new game session."""
        data = request.data
        classroom = get_object_or_404(Classroom, id=data.get('classroom_id'))
        
        # Verify teacher owns classroom
        if classroom.teacher.user != request.user:
            return Response({'error': 'Not your classroom'}, status=status.HTTP_403_FORBIDDEN)
        
        config = None
        if data.get('config_id'):
            config = get_object_or_404(GameConfig, id=data['config_id'])
        
        session = GameSession.objects.create(
            classroom=classroom,
            host=request.user,
            config=config,
        )
        
        return Response({
            'id': session.id,
            'join_code': session.join_code,
            'status': session.status,
        }, status=status.HTTP_201_CREATED)
    
    def retrieve(self, request, pk=None):
        """Get session details including participants."""
        session = get_object_or_404(GameSession, pk=pk)
        participants = session.participant_records.all()
        
        return Response({
            'id': session.id,
            'join_code': session.join_code,
            'classroom': session.classroom.name,
            'status': session.status,
            'current_stage': session.current_stage,
            'state': session.state,
            'config': {
                'id': session.config.id,
                'name': session.config.name,
                'mode': session.config.mode,
                'stages': session.config.stages,
                'settings': session.config.settings,
            } if session.config else None,
            'participants': [{
                'id': p.id,
                'user_id': p.user.id,
                'username': p.user.username,
                'score': p.score,
                'is_ready': p.is_ready,
                'is_active': p.is_active,
            } for p in participants],
            'started_at': session.started_at,
            'created_at': session.created_at,
        })
    
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Student joins a game session."""
        session = get_object_or_404(GameSession, pk=pk)
        
        if session.status not in ['waiting', 'active']:
            return Response({'error': 'Cannot join this session'}, status=status.HTTP_400_BAD_REQUEST)
        
        participant, created = GameParticipant.objects.get_or_create(
            session=session,
            user=request.user,
            defaults={'is_ready': False}
        )
        
        if not created:
            participant.is_active = True
            participant.save()
        
        return Response({
            'id': participant.id,
            'session_id': session.id,
            'join_code': session.join_code,
            'status': session.status,
        })
    
    @action(detail=True, methods=['post'])
    def ready(self, request, pk=None):
        """Player marks themselves as ready."""
        session = get_object_or_404(GameSession, pk=pk)
        participant = get_object_or_404(GameParticipant, session=session, user=request.user)
        
        participant.is_ready = True
        participant.save()
        
        return Response({'is_ready': True})
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Teacher starts the game."""
        session = get_object_or_404(GameSession, pk=pk)
        
        if session.host != request.user:
            return Response({'error': 'Only host can start'}, status=status.HTTP_403_FORBIDDEN)
        
        if session.status != 'waiting':
            return Response({'error': 'Game already started'}, status=status.HTTP_400_BAD_REQUEST)
        
        # --- QUESTION GENERATION ---
        
        # 1. Load config
        config = session.config
        questions = []
        
        if config and config.content_source == 'exam' and config.content_id:
            from .exam_views import Exam
            try:
                exam = Exam.objects.get(id=config.content_id)
                # Assuming exam.questions is list of dicts: {'question': '...', 'options': [], 'answer': ...}
                questions = exam.questions
                
                # Check format validity or transform if needed
                valid_questions = []
                for idx, q in enumerate(questions):
                    if 'question' in q and 'answer' in q:
                        valid_questions.append({
                            'id': idx + 1,
                            'type': 'match', # Default to match for now
                            'question': q['question'],
                            'answer': q['answer'],
                            'options': q.get('options', [])
                        })
                questions = valid_questions
                
            except Exam.DoesNotExist:
                print(f"Exam {config.content_id} not found")
        
        # 2. Shuffle if requested
        if config and config.settings.get('shuffle_questions', True):
            import random
            random.shuffle(questions)
            
        # 3. Store in session state
        session.state['questions'] = questions
        
        session.status = 'active'
        session.started_at = timezone.now()
        session.save()
        
        return Response({'status': 'active', 'started_at': session.started_at, 'question_count': len(questions)})
    
    @action(detail=True, methods=['get', 'post'])
    def sync(self, request, pk=None):
        """
        GET: Fetch current game state (polling endpoint).
        POST: Update game state (teacher or game engine).
        """
        session = get_object_or_404(GameSession, pk=pk)
        
        if request.method == 'GET':
            # Update heartbeat
            participant = GameParticipant.objects.filter(session=session, user=request.user).first()
            if participant:
                participant.last_heartbeat = timezone.now()
                participant.save(update_fields=['last_heartbeat'])
            
            return Response({
                'status': session.status,
                'current_stage': session.current_stage,
                'state': session.state,
                'participants': [{
                    'user_id': p.user.id,
                    'username': p.user.username,
                    'score': p.score,
                    'is_ready': p.is_ready,
                } for p in session.participant_records.filter(is_active=True)],
            })
        
        # POST - update state (host only)
        if session.host != request.user:
            return Response({'error': 'Only host can update state'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        if 'state' in data:
            session.state = data['state']
        if 'current_stage' in data:
            session.current_stage = data['current_stage']
        if 'status' in data:
            session.status = data['status']
        session.save()
        
        return Response({'updated': True})
    
    @action(detail=True, methods=['post'])
    def answer(self, request, pk=None):
        """Player submits an answer."""
        session = get_object_or_404(GameSession, pk=pk)
        participant = get_object_or_404(GameParticipant, session=session, user=request.user)
        
        data = request.data
        is_correct = data.get('is_correct', False)
        response_time = data.get('response_time', 0)
        
        if is_correct:
            participant.correct_answers += 1
            # Score based on speed (faster = more points)
            points = max(10, 100 - int(response_time * 10))
            participant.score += points
        else:
            participant.wrong_answers += 1
        
        # Update average response time
        total_answers = participant.correct_answers + participant.wrong_answers
        participant.avg_response_time = (
            (participant.avg_response_time * (total_answers - 1) + response_time) / total_answers
        ) if total_answers > 0 else response_time
        
        participant.save()
        
        return Response({
            'score': participant.score,
            'correct': participant.correct_answers,
            'wrong': participant.wrong_answers,
        })
    
    @action(detail=False, methods=['post'])
    def create_from_assignment(self, request):
        """Create a game session directly from an assignment."""
        from ..models import Assignment, GameConfig
        
        assignment_id = request.data.get('assignment_id')
        if not assignment_id:
             return Response({'error': 'Assignment ID required'}, status=status.HTTP_400_BAD_REQUEST)

        assignment = get_object_or_404(Assignment, id=assignment_id)
        
        # Verify ownership
        if not hasattr(request.user, 'teacher_profile') or assignment.classroom.teacher.user != request.user:
            return Response({'error': 'Not your classroom'}, status=status.HTTP_403_FORBIDDEN)
            
        # Create a transient GameConfig for this session
        config_name = f"Live: {assignment.title}"
        metadata = assignment.metadata or {}
        game_settings = metadata.get('game_settings', {})
        
        # Map assignment game settings to config settings
        config_settings = {
            'time_limit': game_settings.get('time_per_question', 30),
            'show_leaderboard': game_settings.get('show_leaderboard', True),
            'shuffle_questions': True,
            'powerups_enabled': True
        }
        
        config = GameConfig.objects.create(
            teacher=request.user.teacher_profile,
            name=config_name,
            mode='velocity', # Default mode
            content_source=assignment.content_type, # 'exam', 'story'
            content_id=assignment.content_id,
            settings=config_settings
        )
        
        session = GameSession.objects.create(
            classroom=assignment.classroom,
            host=request.user,
            config=config,
            status='waiting'
        )
        
        return Response({
            'id': session.id,
            'join_code': session.join_code,
            'status': session.status,
            'config_id': config.id
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        """End the game session and sync grades."""
        session = get_object_or_404(GameSession, pk=pk)
        
        if session.host != request.user:
            return Response({'error': 'Only host can end game'}, status=status.HTTP_403_FORBIDDEN)
        
        session.status = 'completed'
        session.ended_at = timezone.now()
        session.save()
        
        # --- THE SUPER LINK: Sync to Assignment Progress ---
        if session.config and session.config.content_id:
             from ..models import Assignment, AssignmentProgress
             # Find the assignment that matches this content/classroom
             assignment = Assignment.objects.filter(
                 classroom=session.classroom,
                 content_type=session.config.content_source,
                 content_id=session.config.content_id
             ).first()
             
             if assignment:
                 try:
                     total_q = len(session.state.get('questions', []))
                     for p in session.participant_records.all():
                         # Calculate score percentage
                         score_percent = 0
                         if total_q > 0:
                             score_percent = min(100, int((p.correct_answers / total_q) * 100))
                         
                         # Create or update progress
                         AssignmentProgress.objects.update_or_create(
                             assignment=assignment,
                             student=p.user,
                             defaults={
                                 'status': 'completed',
                                 'score': score_percent,
                                 'submitted_at': timezone.now(),
                                 'feedback': f'Completed via Live Game Mode (Rank: #0)' # Rank logic could be improved
                             }
                         )
                 except Exception as e:
                     print(f"Error syncing grades: {e}")
        
        # Get final leaderboard
        participants = session.participant_records.order_by('-score')
        leaderboard = [{
            'rank': i + 1,
            'username': p.user.username,
            'score': p.score,
            'correct': p.correct_answers,
            'avg_time': round(p.avg_response_time, 2),
        } for i, p in enumerate(participants)]
        
        return Response({
            'status': 'completed',
            'leaderboard': leaderboard,
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_by_code(request):
    """Join a game session by code."""
    code = request.data.get('code', '').upper()
    session = get_object_or_404(GameSession, join_code=code)
    
    if session.status not in ['waiting', 'active']:
        return Response({'error': 'Cannot join this session'}, status=status.HTTP_400_BAD_REQUEST)
    
    participant, created = GameParticipant.objects.get_or_create(
        session=session,
        user=request.user,
        defaults={'is_ready': False}
    )
    
    return Response({
        'session_id': session.id,
        'join_code': session.join_code,
        'classroom': session.classroom.name,
        'status': session.status,
    })
