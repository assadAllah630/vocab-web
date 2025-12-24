"""
Teacher API Views - Manage teacher profiles and upgrade flow.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.db.models import Count, Q
from api.models import Teacher, Classroom, ClassMembership
from api.serializers import TeacherSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def become_teacher(request):
    """
    Upgrade current user to teacher role.
    
    POST /api/teachers/become/
    Body: {organization_name?, subjects?, bio?}
    """
    user = request.user
    
    # Check if already a teacher
    if hasattr(user, 'teacher_profile'):
        return Response(
            {'error': 'You are already a teacher', 'is_teacher': True},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create teacher profile
    teacher = Teacher.objects.create(
        user=user,
        organization_name=request.data.get('organization_name', ''),
        subjects=request.data.get('subjects', []),
        bio=request.data.get('bio', '')
    )
    
    serializer = TeacherSerializer(teacher)
    return Response({
        **serializer.data,
        'message': 'You are now a teacher! Start creating classrooms.'
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_teacher_profile(request):
    """
    Get current user's teacher profile.
    
    GET /api/teachers/me/
    """
    user = request.user
    
    if not hasattr(user, 'teacher_profile'):
        return Response(
            {'error': 'You are not a teacher', 'is_teacher': False},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = TeacherSerializer(user.teacher_profile)
    return Response({**serializer.data, 'is_teacher': True})


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_teacher_profile(request):
    """
    Update current user's teacher profile.
    
    PUT/PATCH /api/teachers/me/update/
    Body: {organization_name?, subjects?, bio?}
    """
    user = request.user
    
    if not hasattr(user, 'teacher_profile'):
        return Response(
            {'error': 'You are not a teacher'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    teacher = user.teacher_profile
    serializer = TeacherSerializer(teacher, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_teacher_status(request):
    """
    Quick check if user is a teacher WITH an approved application.
    
    GET /api/teachers/status/
    Returns: {is_teacher, has_approved_application, application_status, classroom_count, max_classrooms}
    
    IMPORTANT: is_teacher will only be True if the user:
    1. Has a teacher_profile AND
    2. Has an approved TeacherApplication
    """
    from api.models import TeacherApplication
    
    has_teacher_profile = hasattr(request.user, 'teacher_profile')
    
    # Check for approved application
    application = TeacherApplication.objects.filter(user=request.user).order_by('-created_at').first()
    has_approved_application = application and application.status == 'approved'
    application_status = application.status if application else 'none'
    
    # Teacher status requires BOTH profile AND approved application
    is_teacher = has_teacher_profile and has_approved_application
    
    if is_teacher:
        teacher = request.user.teacher_profile
        return Response({
            'is_teacher': True,
            'has_approved_application': True,
            'application_status': 'approved',
            'classroom_count': teacher.classrooms.count(),
            'max_classrooms': teacher.max_classrooms,
            'is_verified': teacher.is_verified
        })
    
    return Response({
        'is_teacher': False,
        'has_teacher_profile': has_teacher_profile,
        'has_approved_application': has_approved_application,
        'application_status': application_status,
        'classroom_count': 0,
        'max_classrooms': 0,
        'message': 'Teacher application required' if not has_approved_application else 'Teacher profile missing'
    })


class TeacherViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin-only ViewSet to monitor teachers.
    """
    queryset = Teacher.objects.all().select_related('user').annotate(
        classroom_count=Count('classrooms', distinct=True),
    )
    serializer_class = TeacherSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        # We can add a calculated field for student_count
        # This is a bit complex in a single query with multiple M2M, 
        # but let's at least return the basics.
        return super().get_queryset()

    @action(detail=True, methods=['get'])
    def performance(self, request, pk=None):
        teacher = self.get_object()
        classes = teacher.classrooms.all()
        
        student_count = ClassMembership.objects.filter(
            classroom__teacher=teacher,
            status='active'
        ).values('student').distinct().count()
        
        return Response({
            'teacher_id': teacher.id,
            'username': teacher.user.username,
            'total_classrooms': classes.count(),
            'total_students': student_count,
            'is_verified': teacher.is_verified,
            'organization': teacher.organization_name
        })
