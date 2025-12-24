from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from ..models import LiveSession, SessionAttendance, SessionReminder, Teacher
from ..serializers import LiveSessionSerializer, SessionAttendanceSerializer
from ..services.livekit_service import livekit_service

class LiveSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing live tutoring sessions."""
    serializer_class = LiveSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'teacher_profile'):
            queryset = LiveSession.objects.filter(teacher=user.teacher_profile)
            classroom_id = self.request.query_params.get('classroom_id')
            if classroom_id:
                queryset = queryset.filter(classroom_id=classroom_id)
            return queryset
        # Students see sessions from their enrolled classrooms
        # Students see sessions from their enrolled classrooms
        queryset = LiveSession.objects.filter(
            classroom__memberships__student=user,
            classroom__memberships__status='active'
        ).distinct()

        classroom_id = self.request.query_params.get('classroom_id')
        if classroom_id:
            queryset = queryset.filter(classroom_id=classroom_id)
            
        return queryset

    def create(self, request, *args, **kwargs):
        """Override create to add better error messaging."""
        # Check if user is a teacher
        if not hasattr(request.user, 'teacher_profile'):
            return Response(
                {'error': 'Only teachers can create sessions. Apply to become a teacher first.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        teacher = self.request.user.teacher_profile
        session = serializer.save(teacher=teacher)
        
        # Auto-generate Livekit room URL
        if livekit_service.is_configured():
            room_name = f"session_{session.id}"
            session.meeting_url = livekit_service.get_room_url(room_name)
            session.meeting_id = room_name
            session.save()

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        session = self.get_object()
        session.status = 'live'
        session.save()
        return Response({'status': 'live'})

    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        session = self.get_object()
        session.status = 'completed'
        session.save()
        return Response({'status': 'completed'})

    @action(detail=True, methods=['post'])
    def evaluate(self, request, pk=None):
        """
        Evaluate session outcomes - updates CLASS-LEVEL progress.
        Also creates remediation entries for absent students.
        
        Request body:
        - class_completion_percent: int (0-100) - Class-wide step completion
        """
        session = self.get_object()
        class_percent = request.data.get('class_completion_percent', 0)
        
        if not session.linked_path_node:
            return Response({'error': 'Session not linked to a curriculum step'}, status=400)
            
        linked_node = session.linked_path_node
        classroom = session.classroom
        
        # === 1. UPDATE CLASS-LEVEL PROGRESS ===
        from api.models import ClassPathProgress, StudentRemediation, ClassMembership
        
        progress, _ = ClassPathProgress.objects.get_or_create(
            classroom=classroom,
            node=linked_node
        )
        progress.completion_percent = min(100, max(0, int(class_percent)))
        progress.status = 'completed' if progress.completion_percent >= 100 else 'in_progress'
        progress.last_session = session
        progress.save()
        
        # === 2. CREATE REMEDIATION FOR ABSENT STUDENTS ===
        # Get all active students in classroom
        active_members = ClassMembership.objects.filter(
            classroom=classroom,
            status='active'
        ).values_list('student_id', flat=True)
        
        # Get students who attended
        attended_students = set(
            session.attendance.filter(status='attended').values_list('student_id', flat=True)
        )
        
        # Students who missed = active - attended
        missed_students = set(active_members) - attended_students
        remediation_count = 0
        
        for student_id in missed_students:
            remediation, created = StudentRemediation.objects.get_or_create(
                student_id=student_id,
                classroom=classroom,
                node=linked_node,
                defaults={
                    'reason': 'missed_session',
                    'remediation_type': 'watch_recording',
                    'content_id': session.id if session.recording_url else None
                }
            )
            if created:
                remediation_count += 1
        
        return Response({
            'status': 'success',
            'class_progress_percent': progress.completion_percent,
            'class_status': progress.status,
            'remediation_created': remediation_count,
            'attended_count': len(attended_students),
            'missed_count': len(missed_students)
        })

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        session = self.get_object()
        attendance, _ = SessionAttendance.objects.get_or_create(
            session=session,
            student=request.user
        )
        attendance.status = 'attended'
        attendance.joined_at = timezone.now()
        attendance.save()
        return Response(SessionAttendanceSerializer(attendance).data)

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        session = self.get_object()
        attendance = SessionAttendance.objects.filter(
            session=session, student=request.user
        ).first()
        if attendance:
            attendance.left_at = timezone.now()
            if attendance.joined_at:
                duration = (attendance.left_at - attendance.joined_at).seconds // 60
                attendance.duration_minutes = duration
            attendance.save()
        return Response({'status': 'left'})

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        now = timezone.now()
        sessions = self.get_queryset().filter(
            status='scheduled',
            scheduled_at__gte=now
        ).order_by('scheduled_at')[:10]
        return Response(LiveSessionSerializer(sessions, many=True).data)

    @action(detail=True, methods=['get'])
    def get_token(self, request, pk=None):
        """
        Get Livekit access token for joining this session.
        
        Returns:
            - token: JWT access token for Livekit
            - room_name: Name of the Livekit room
            - server_url: Livekit server URL
        """
        session = self.get_object()
        
        if not livekit_service.is_configured():
            return Response(
                {'error': 'Video service not configured'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        room_name = f"session_{session.id}"
        
        # Check if user is the host (teacher)
        is_host = (
            hasattr(request.user, 'teacher_profile') and 
            session.teacher == request.user.teacher_profile
        )
        
        # Generate token
        token = livekit_service.generate_token(
            room_name=room_name,
            participant_identity=str(request.user.id),
            participant_name=request.user.username,
            is_host=is_host
        )
        
        return Response({
            'token': token,
            'room_name': room_name,
            'server_url': livekit_service.url,
            'is_host': is_host
        })

    @action(detail=True, methods=['get'])
    def attendance_report(self, request, pk=None):
        """Get attendance report for a session (teachers only)."""
        session = self.get_object()
        
        # Only teachers can view attendance reports
        if not hasattr(request.user, 'teacher_profile') or session.teacher != request.user.teacher_profile:
            return Response(
                {'error': 'Only the teacher can view attendance'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        attendance_list = session.attendance.all()
        
        return Response({
            'session_id': session.id,
            'session_title': session.title,
            'total_enrolled': session.classroom.memberships.filter(status='active').count(),
            'total_attended': attendance_list.filter(status='attended').count(),
            'attendance': SessionAttendanceSerializer(attendance_list, many=True).data
        })

