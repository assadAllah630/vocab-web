from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from ..models import TeacherApplication, Teacher

class TeacherApplicationSerializer(serializers.ModelSerializer):
    """Serializer for Teacher Applications."""
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = TeacherApplication
        fields = [
            'id', 'user', 'username', 'status', 'resume_link', 
            'intro_video_link', 'experience_years', 'teaching_languages', 
            'bio', 'admin_feedback', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'status', 'admin_feedback', 'created_at']

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_for_teacher(request):
    """
    Submit a new teacher application.
    """
    # Check if user already has an application
    existing_application = TeacherApplication.objects.filter(user=request.user).first()
    if existing_application:
        return Response({
            "error": "You already have an active application.",
            "status": existing_application.status
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check if user is already a teacher
    if hasattr(request.user, 'teacher_profile'):
        return Response({
            "error": "You are already a teacher!"
        }, status=status.HTTP_400_BAD_REQUEST)

    serializer = TeacherApplicationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    print(f"[TEACHER APP] Validation Error: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_application(request):
    """
    Get the status of the current user's application.
    """
    application = TeacherApplication.objects.filter(user=request.user).order_by('-created_at').first()
    if not application:
        return Response({"status": "none"}, status=status.HTTP_200_OK)
    
    serializer = TeacherApplicationSerializer(application)
    return Response(serializer.data)

# --- Admin Views ---

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_applications(request):
    """
    Admin: List all pending applications.
    """
    # Filter by status if provided ?status=pending
    status_filter = request.query_params.get('status', 'pending')
    applications = TeacherApplication.objects.filter(status=status_filter).order_by('-created_at')
    serializer = TeacherApplicationSerializer(applications, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def approve_application(request, application_id):
    """
    Admin: Approve an application and create the Teacher profile.
    """
    application = get_object_or_404(TeacherApplication, id=application_id)
    
    if application.status == 'approved':
        return Response({"error": "Application already approved"}, status=status.HTTP_400_BAD_REQUEST)

    # Create Teacher Profile
    if not hasattr(application.user, 'teacher_profile'):
        Teacher.objects.create(
            user=application.user,
            bio=application.bio,
            subjects=application.teaching_languages,
            is_verified=True
        )

    # Update Application Status
    application.status = 'approved'
    application.reviewed_by = request.user
    application.save()
    
    return Response({"message": f"Approved {application.user.username} as a teacher!"})

@api_view(['POST'])
@permission_classes([IsAdminUser])
def reject_application(request, application_id):
    """
    Admin: Reject an application with feedback.
    """
    application = get_object_or_404(TeacherApplication, id=application_id)
    feedback = request.data.get('feedback', 'Requirements not met.')
    
    application.status = 'rejected'
    application.admin_feedback = feedback
    application.reviewed_by = request.user
    application.save()
    
    return Response({"message": "Application rejected."})
