"""
Classroom API Views - CRUD operations for classroom management.
"""
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q, Avg
from django.core.mail import send_mail
from django.conf import settings

from api.models import Classroom, ClassMembership
from api.serializers import ClassroomSerializer, ClassroomDetailSerializer, ClassMembershipSerializer
from api.permissions import IsTeacher


class ClassroomViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Classroom CRUD operations.
    
    Teachers can create, update, delete their own classrooms.
    Students can view classrooms they're enrolled in.
    """
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Staff see EVERYTHING
        if user.is_staff:
            return Classroom.objects.all()
        
        # Teachers see their own classrooms
        if hasattr(user, 'teacher_profile'):
            if self.request.query_params.get('role') == 'student':
                # Teacher viewing as student (enrolled classrooms)
                return Classroom.objects.filter(
                    memberships__student=user,
                    memberships__status='active'
                ).distinct()
            return user.teacher_profile.classrooms.all()
        
        # Students see enrolled classrooms only
        return Classroom.objects.filter(
            memberships__student=user,
            memberships__status='active'
        ).distinct()
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsTeacher()]
        if self.action in ['admin_overview']:
            from rest_framework.permissions import IsAdminUser
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ClassroomDetailSerializer
        return ClassroomSerializer
    
    def perform_create(self, serializer):
        teacher = self.request.user.teacher_profile
        
        # Check classroom limit
        current_count = teacher.classrooms.count()
        if current_count >= teacher.max_classrooms:
            raise serializers.ValidationError(
                f'Maximum classroom limit ({teacher.max_classrooms}) reached'
            )
        
        serializer.save(teacher=teacher)
    
    def perform_update(self, serializer):
        # Ensure teacher owns this classroom
        classroom = self.get_object()
        if classroom.teacher.user != self.request.user:
            raise PermissionDenied('You can only edit your own classrooms')
        serializer.save()
    
    def perform_destroy(self, instance):
        # Ensure teacher owns this classroom
        if instance.teacher.user != self.request.user:
            raise PermissionDenied('You can only delete your own classrooms')
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def regenerate_invite(self, request, pk=None):
        """Regenerate invite code for classroom."""
        classroom = self.get_object()
        
        if classroom.teacher.user != request.user:
            return Response(
                {'error': 'Only the classroom teacher can regenerate invite code'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Generate new code
        classroom.invite_code = classroom._generate_invite_code()
        classroom.save()
        
        return Response({
            'invite_code': classroom.invite_code,
            'message': 'Invite code regenerated successfully'
        })
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Activate or deactivate classroom."""
        classroom = self.get_object()
        
        if classroom.teacher.user != request.user:
            return Response(
                {'error': 'Only the classroom teacher can change status'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        classroom.is_active = not classroom.is_active
        classroom.save()
        
        return Response({
            'is_active': classroom.is_active,
            'message': f"Classroom {'activated' if classroom.is_active else 'deactivated'}"
        })
    
    @action(detail=False, methods=['get'])
    def my_teaching(self, request):
        """Get classrooms where user is teacher."""
        if not hasattr(request.user, 'teacher_profile'):
            return Response([])
        
        classrooms = request.user.teacher_profile.classrooms.all()
        serializer = self.get_serializer(classrooms, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_enrolled(self, request):
        """Get classrooms where user is student."""
        classrooms = Classroom.objects.filter(
            memberships__student=request.user,
            memberships__status='active'
        ).distinct()
        serializer = self.get_serializer(classrooms, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def admin_overview(self, request):
        """Aggregate stats for platform admins."""
        total_classes = Classroom.objects.count()
        active_classes = Classroom.objects.filter(is_active=True).count()
        total_enrollments = ClassMembership.objects.filter(status='active').count()
        pending_requests = ClassMembership.objects.filter(status='pending').count()
        
        return Response({
            'total_classrooms': total_classes,
            'active_classrooms': active_classes,
            'total_enrollments': total_enrollments,
            'pending_requests': pending_requests,
        })

    @action(detail=True, methods=['get'])
    def path_stats(self, request, pk=None):
        """
        Get learning path statistics for this classroom.
        Returns aggregate progress and per-student details.
        """
        classroom = self.get_object()
        
        # 1. Identify the relevant path
        from ..models import LearningPath, PathNode, PathEnrollment, NodeProgress
        
        path_id = request.query_params.get('path_id')
        path = None
        
        if path_id:
            path = LearningPath.objects.filter(id=path_id).first()
        elif classroom.current_sublevel:
            # Default to the path of the current sublevel
            path = classroom.current_sublevel.path
        else:
            # Try to find a path matching the classroom languages
            path = LearningPath.objects.filter(
                speaking_language=classroom.speaking_language,
                target_language=classroom.target_language
            ).first()
            
        if not path:
            return Response({
                'has_path': False,
                'message': 'No learning path associated with this classroom.'
            })
            
        # 2. Calculate Total Nodes
        total_nodes = PathNode.objects.filter(sublevel__path=path).count()
        if total_nodes == 0:
             return Response({
                'has_path': True,
                'path_title': path.title,
                'total_nodes': 0,
                'class_average': 0,
                'students': []
            })

        # 3. Get Active Students
        memberships = classroom.memberships.filter(status='active').select_related('student')
        
        student_stats = []
        total_completion = 0
        
        for membership in memberships:
            student = membership.student
            
            # Get Enrollment
            enrollment = PathEnrollment.objects.filter(path=path, student=student).first()
            
            completed_count = 0
            current_node_title = "Not started"
            current_sublevel_code = "-"
            
            if enrollment:
                # Count completed nodes
                completed_count = NodeProgress.objects.filter(
                    enrollment=enrollment, 
                    status='completed'
                ).count()
                
                # Find current node (latest active or last completed)
                # First check for in_progress
                current = NodeProgress.objects.filter(
                    enrollment=enrollment,
                    status__in=['in_progress', 'available']
                ).order_by('-id').first()
                
                if current and current.node:
                     current_node_title = current.node.title
                     if current.node.sublevel:
                         current_sublevel_code = current.node.sublevel.sublevel_code
                elif completed_count > 0:
                     current_node_title = "All caught up" 
                     # Or find the very last one?
                
            progress_percent = min(100, round((completed_count / total_nodes) * 100))
            total_completion += progress_percent
            
            student_stats.append({
                'student_id': student.id,
                'name': student.username, # Or student.first_name
                'avatar': student.profile.avatar.url if student.profile.avatar else None,
                'progress_percent': progress_percent,
                'completed_nodes': completed_count,
                'current_node': current_node_title,
                'current_sublevel': current_sublevel_code
            })
            
        # 4. Aggregate
        class_average = 0
        if len(memberships) > 0:
            class_average = round(total_completion / len(memberships))
            
        return Response({
            'has_path': True,
            'path_id': path.id,
            'path_title': path.title,
            'total_nodes': total_nodes,
            'student_count': len(memberships),
            'class_average': class_average,
            'students': student_stats
        })

    @action(detail=True, methods=['get'])
    def class_path_progress(self, request, pk=None):
        """
        Get CLASS-LEVEL path progress for this classroom.
        Returns progress for each step, shared by all students.
        """
        from api.models import ClassPathProgress, PathNode
        from api.serializers import ClassPathProgressSerializer
        
        classroom = self.get_object()
        
        if not classroom.linked_path:
            return Response({
                'has_path': False,
                'message': 'No learning path linked to this classroom'
            })
        
        # Get all nodes from the linked path
        nodes = PathNode.objects.filter(
            sublevel__path=classroom.linked_path
        ).order_by('sublevel__order', 'order')
        
        # Get existing progress records
        progress_records = ClassPathProgress.objects.filter(
            classroom=classroom
        ).select_related('node', 'node__sublevel', 'last_session')
        
        progress_map = {p.node_id: p for p in progress_records}
        
        # Build response with all nodes
        result = []
        for node in nodes:
            if node.id in progress_map:
                result.append(ClassPathProgressSerializer(progress_map[node.id]).data)
            else:
                # Node has no progress yet - return default
                result.append({
                    'id': None,
                    'classroom': classroom.id,
                    'node': node.id,
                    'node_title': node.title,
                    'node_type': node.node_type,
                    'node_order': node.order,
                    'sublevel_code': node.sublevel.code,
                    'completion_percent': 0,
                    'status': 'pending',
                    'last_session': None,
                    'last_session_title': None,
                    'last_assignment': None,
                    'notes': '',
                    'updated_at': None
                })
        
        return Response({
            'has_path': True,
            'path_id': classroom.linked_path.id,
            'path_title': classroom.linked_path.title,
            'total_nodes': len(result),
            'completed_nodes': sum(1 for r in result if r['status'] == 'completed'),
            'progress': result
        })

    @action(detail=True, methods=['patch'], url_path='steps/(?P<node_id>[0-9]+)')
    def update_step_progress(self, request, pk=None, node_id=None):
        """
        Update class-level progress for a specific step.
        Teacher only - updates progress for entire class.
        """
        from api.models import ClassPathProgress, PathNode
        from api.serializers import ClassPathProgressSerializer
        
        classroom = self.get_object()
        
        # Check teacher permission
        if not hasattr(request.user, 'teacher_profile') or classroom.teacher != request.user.teacher_profile:
            return Response({'error': 'Only the classroom teacher can update progress'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get the node
        try:
            node = PathNode.objects.get(id=node_id)
        except PathNode.DoesNotExist:
            return Response({'error': 'Step not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get or create progress record
        progress, created = ClassPathProgress.objects.get_or_create(
            classroom=classroom,
            node=node
        )
        
        # Update fields
        if 'completion_percent' in request.data:
            progress.completion_percent = min(100, max(0, int(request.data['completion_percent'])))
            # Auto-update status based on percent
            if progress.completion_percent >= 100:
                progress.status = 'completed'
            elif progress.completion_percent > 0:
                progress.status = 'in_progress'
            else:
                progress.status = 'pending'
        
        if 'status' in request.data:
            progress.status = request.data['status']
        
        if 'notes' in request.data:
            progress.notes = request.data['notes']
        
        progress.save()
        
        return Response(ClassPathProgressSerializer(progress).data)


# =============================================================================
# Invite System Endpoints
# =============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def validate_invite_code(request, code):
    """
    Validate invite code and return classroom info.
    Does not join - just validates.
    """
    try:
        classroom = Classroom.objects.get(invite_code=code.upper(), is_active=True)
    except Classroom.DoesNotExist:
        return Response({
            'valid': False,
            'error': 'Invalid or expired invite code'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if already enrolled
    existing = ClassMembership.objects.filter(
        classroom=classroom,
        student=request.user
    ).first()
    
    if existing and existing.status in ['active', 'pending']:
        return Response({
            'valid': True,
            'already_enrolled': True,
            'status': existing.status,
            'classroom': ClassroomSerializer(classroom).data
        })
    
    # Check if classroom is full
    current_students = classroom.memberships.filter(status='active').count()
    is_full = current_students >= classroom.max_students
    
    return Response({
        'valid': True,
        'already_enrolled': False,
        'is_full': is_full,
        'requires_approval': classroom.requires_approval,
        'classroom': {
            'id': classroom.id,
            'name': classroom.name,
            'description': classroom.description,
            'level': classroom.level,
            'language': classroom.language,
            'teacher_name': classroom.teacher.user.username,
            'student_count': current_students,
            'max_students': classroom.max_students
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_with_code(request):
    """
    Join a classroom using invite code.
    """
    code = request.data.get('invite_code', '').upper()
    
    if not code:
        return Response(
            {'error': 'Invite code is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        classroom = Classroom.objects.get(invite_code=code, is_active=True)
    except Classroom.DoesNotExist:
        return Response(
            {'error': 'Invalid or expired invite code'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if already enrolled
    existing = ClassMembership.objects.filter(
        classroom=classroom,
        student=request.user
    ).first()
    
    if existing:
        if existing.status == 'active':
            return Response(
                {'error': 'You are already enrolled in this classroom'},
                status=status.HTTP_400_BAD_REQUEST
            )
        elif existing.status == 'pending':
            return Response(
                {'error': 'Your join request is pending approval'},
                status=status.HTTP_400_BAD_REQUEST
            )
        else:
            # Removed or Paused - reactivate
            # This allows removed students to rejoin
            existing.status = 'active' if not classroom.requires_approval else 'pending'
            existing.save()
            return Response({
                'message': 'Rejoined classroom' if existing.status == 'active' else 'Join request submitted',
                'status': existing.status,
                'classroom': ClassroomSerializer(classroom).data
            })
    
    # Check if classroom is full
    current_students = classroom.memberships.filter(status='active').count()
    if current_students >= classroom.max_students:
        return Response(
            {'error': 'This classroom is full'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create membership
    status_val = 'pending' if classroom.requires_approval else 'active'
    membership = ClassMembership.objects.create(
        classroom=classroom,
        student=request.user,
        status=status_val
    )
    
    return Response({
        'message': 'Joined classroom successfully' if status_val == 'active' else 'Join request submitted for approval',
        'status': status_val,
        'classroom': ClassroomSerializer(classroom).data
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_share_link(request, classroom_id):
    """
    Get shareable link for classroom invite.
    Only classroom teacher can get this.
    """
    try:
        # Validate ID to prevent 500
        int(classroom_id)
        classroom = Classroom.objects.get(id=classroom_id)
    except (ValueError, TypeError):
        return Response({'error': 'Invalid classroom ID'}, status=400)
    except Classroom.DoesNotExist:
        return Response(
            {'error': 'Classroom not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if classroom.teacher.user != request.user:
        return Response(
            {'error': 'Only the teacher can get share links'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Build share link (frontend URL)
    base_url = request.build_absolute_uri('/').rstrip('/')
    # Assuming frontend route: /join/{code}
    share_link = f"{base_url}/join/{classroom.invite_code}"
    
    return Response({
        'invite_code': classroom.invite_code,
        'share_link': share_link,
        'qr_data': classroom.invite_code  # Can be used to generate QR code on frontend
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_invite_emails(request, classroom_id):
    """
    Send invite emails to list of email addresses.
    Only classroom teacher can send invites.
    """
    try:
        classroom = Classroom.objects.get(id=classroom_id)
    except Classroom.DoesNotExist:
        return Response(
            {'error': 'Classroom not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if classroom.teacher.user != request.user:
        return Response(
            {'error': 'Only the teacher can send invites'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    emails = request.data.get('emails', [])
    if not emails:
        return Response(
            {'error': 'No email addresses provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Limit batch size
    if len(emails) > 50:
        return Response(
            {'error': 'Maximum 50 emails per batch'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    base_url = request.build_absolute_uri('/').rstrip('/')
    share_link = f"{base_url}/join/{classroom.invite_code}"
    
    subject = f"Invitation to join {classroom.name}"
    message = f"""
Hello,

{request.user.username} has invited you to join their classroom "{classroom.name}" on VocabMaster.

Level: {classroom.get_level_display()}
Language: {classroom.language.upper()}

Click here to join: {share_link}

Or use this invite code: {classroom.invite_code}

Happy learning!
VocabMaster Team
    """
    
    sent_count = 0
    failed = []
    
    for email in emails:
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False
            )
            sent_count += 1
        except Exception as e:
            failed.append({'email': email, 'error': str(e)})
    
    return Response({
        'sent': sent_count,
        'failed': failed,
        'message': f'Sent {sent_count} invitation(s)'
    })


# =============================================================================
# Membership Management Endpoints
# =============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_classroom_students(request, classroom_id):
    """
    List all students in a classroom with their status.
    Teachers see all, students see active only.
    """
    try:
        classroom = Classroom.objects.get(id=classroom_id)
    except Classroom.DoesNotExist:
        return Response({'error': 'Classroom not found'}, status=404)
    
    # Check access
    is_teacher = (
        hasattr(request.user, 'teacher_profile') and 
        classroom.teacher.user == request.user
    )
    is_member = ClassMembership.objects.filter(
        classroom=classroom,
        student=request.user,
        status='active'
    ).exists()
    
    if not is_teacher and not is_member:
        return Response({'error': 'Access denied'}, status=403)
    
    # Teachers see all, students see active only
    if is_teacher:
        memberships = classroom.memberships.all()
    else:
        memberships = classroom.memberships.filter(status='active')
    
    memberships = memberships.select_related('student')
    
    data = [
        {
            'id': m.id,
            'student_id': m.student.id,
            'username': m.student.username,
            'email': m.student.email if is_teacher else None,
            'status': m.status,
            'joined_at': m.joined_at
        }
        for m in memberships
    ]
    
    return Response({
        'classroom_id': classroom_id,
        'classroom_name': classroom.name,
        'total': len(data),
        'students': data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_membership(request, classroom_id, membership_id):
    """
    Approve a pending membership request.
    Teacher only.
    """
    try:
        classroom = Classroom.objects.get(id=classroom_id)
    except Classroom.DoesNotExist:
        return Response({'error': 'Classroom not found'}, status=404)
    
    if classroom.teacher.user != request.user:
        return Response({'error': 'Only the teacher can approve'}, status=403)
    
    try:
        membership = ClassMembership.objects.get(
            id=membership_id,
            classroom=classroom,
            status='pending'
        )
    except ClassMembership.DoesNotExist:
        return Response({'error': 'Pending request not found'}, status=404)
    
    # Check capacity
    current = classroom.memberships.filter(status='active').count()
    if current >= classroom.max_students:
        return Response({'error': 'Classroom is at capacity'}, status=400)
    
    membership.status = 'active'
    membership.save()
    
    return Response({
        'message': f'{membership.student.username} approved',
        'membership': ClassMembershipSerializer(membership).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_membership(request, classroom_id, membership_id):
    """
    Reject a pending membership request.
    Teacher only.
    """
    try:
        classroom = Classroom.objects.get(id=classroom_id)
    except Classroom.DoesNotExist:
        return Response({'error': 'Classroom not found'}, status=404)
    
    if classroom.teacher.user != request.user:
        return Response({'error': 'Only the teacher can reject'}, status=403)
    
    try:
        membership = ClassMembership.objects.get(
            id=membership_id,
            classroom=classroom,
            status='pending'
        )
    except ClassMembership.DoesNotExist:
        return Response({'error': 'Pending request not found'}, status=404)
    
    student_name = membership.student.username
    membership.delete()  # Remove the request entirely
    
    return Response({'message': f'{student_name} request rejected'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_student(request, classroom_id, student_id):
    """
    Remove a student from classroom.
    Teacher only.
    """
    try:
        classroom = Classroom.objects.get(id=classroom_id)
    except Classroom.DoesNotExist:
        return Response({'error': 'Classroom not found'}, status=404)
    
    if classroom.teacher.user != request.user:
        return Response({'error': 'Only the teacher can remove students'}, status=403)
    
    try:
        membership = ClassMembership.objects.get(
            classroom=classroom,
            student_id=student_id
        )
    except ClassMembership.DoesNotExist:
        return Response({'error': 'Student not found in classroom'}, status=404)
    
    membership.status = 'removed'
    membership.save()
    
    return Response({'message': f'{membership.student.username} removed from classroom'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pause_student(request, classroom_id, student_id):
    """
    Pause a student's membership (temporary).
    Teacher only.
    """
    try:
        classroom = Classroom.objects.get(id=classroom_id)
    except Classroom.DoesNotExist:
        return Response({'error': 'Classroom not found'}, status=404)
    
    if classroom.teacher.user != request.user:
        return Response({'error': 'Only the teacher can pause students'}, status=403)
    
    try:
        membership = ClassMembership.objects.get(
            classroom=classroom,
            student_id=student_id,
            status='active'
        )
    except ClassMembership.DoesNotExist:
        return Response({'error': 'Active student not found'}, status=404)
    
    membership.status = 'paused'
    membership.save()
    
    return Response({'message': f'{membership.student.username} paused'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reactivate_student(request, classroom_id, student_id):
    """
    Reactivate a paused student.
    Teacher only.
    """
    try:
        classroom = Classroom.objects.get(id=classroom_id)
    except Classroom.DoesNotExist:
        return Response({'error': 'Classroom not found'}, status=404)
    
    if classroom.teacher.user != request.user:
        return Response({'error': 'Only the teacher can reactivate students'}, status=403)
    
    try:
        membership = ClassMembership.objects.get(
            classroom=classroom,
            student_id=student_id,
            status='paused'
        )
    except ClassMembership.DoesNotExist:
        return Response({'error': 'Paused student not found'}, status=404)
    
    membership.status = 'active'
    membership.save()
    
    return Response({'message': f'{membership.student.username} reactivated'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_classroom(request, classroom_id):
    """
    Student leaves a classroom voluntarily.
    """
    try:
        # Validate ID to prevent 500
        int(classroom_id)
        membership = ClassMembership.objects.get(
            classroom_id=classroom_id,
            student=request.user,
            status__in=['active', 'pending']
        )
    except (ValueError, TypeError):
        return Response({'error': 'Invalid classroom ID'}, status=400)
    except ClassMembership.DoesNotExist:
        return Response({'error': 'You are not in this classroom'}, status=404)
    
    classroom_name = membership.classroom.name
    membership.delete()  # Fully remove so they can rejoin later
    
    return Response({'message': f'You have left {classroom_name}'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_requests(request, classroom_id):
    """
    Get pending join requests for a classroom.
    Teacher only.
    """
    try:
        classroom = Classroom.objects.get(id=classroom_id)
    except Classroom.DoesNotExist:
        return Response({'error': 'Classroom not found'}, status=404)
    
    if classroom.teacher.user != request.user:
        return Response({'error': 'Only the teacher can view requests'}, status=403)
    
    pending = classroom.memberships.filter(status='pending').select_related('student')
    
    data = [
        {
            'id': m.id,
            'student_id': m.student.id,
            'username': m.student.username,
            'email': m.student.email,
            'requested_at': m.joined_at
        }
        for m in pending
    ]
    
    return Response({
        'classroom_id': classroom_id,
        'pending_count': len(data),
        'requests': data
    })
