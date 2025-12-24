from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count
from django.shortcuts import get_object_or_404
from ..models import Organization, OrganizationMembership, Classroom, User
from ..serializers import OrganizationSerializer, OrganizationMembershipSerializer

class IsOrgAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return OrganizationMembership.objects.filter(
            organization=obj, user=request.user, role='admin'
        ).exists()

class OrganizationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing organizations."""
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'

    def get_queryset(self):
        return Organization.objects.filter(
            members__user=self.request.user
        ).distinct()

    @action(detail=True, methods=['get'])
    def dashboard(self, request, slug=None):
        org = self.get_object()
        teachers = org.members.filter(role='teacher').count()
        students = org.members.filter(role='student').count()
        classrooms = Classroom.objects.filter(
            teacher__user__org_memberships__organization=org
        ).count()
        
        return Response({
            'name': org.name,
            'teachers': teachers,
            'max_teachers': org.max_teachers,
            'students': students,
            'max_students': org.max_students,
            'classrooms': classrooms,
        })

    @action(detail=True, methods=['get'])
    def members(self, request, slug=None):
        org = self.get_object()
        members = org.members.select_related('user', 'invited_by')
        role = request.query_params.get('role')
        if role:
            members = members.filter(role=role)
        return Response(OrganizationMembershipSerializer(members, many=True).data)

    @action(detail=True, methods=['post'])
    def invite(self, request, slug=None):
        org = self.get_object()
        email = request.data.get('email')
        role = request.data.get('role', 'student')
        
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        membership, created = OrganizationMembership.objects.get_or_create(
            organization=org,
            user=user,
            defaults={'role': role, 'invited_by': request.user}
        )
        if not created:
            return Response({'error': 'Already a member'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(OrganizationMembershipSerializer(membership).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='members/(?P<member_id>[^/.]+)')
    def remove_member(self, request, slug=None, member_id=None):
        org = self.get_object()
        membership = get_object_or_404(OrganizationMembership, id=member_id, organization=org)
        membership.delete()
        return Response({'status': 'removed'})

    @action(detail=True, methods=['get'])
    def classrooms(self, request, slug=None):
        org = self.get_object()
        from ..serializers import ClassroomSerializer
        classrooms = Classroom.objects.filter(
            teacher__user__org_memberships__organization=org
        )
        return Response(ClassroomSerializer(classrooms, many=True).data)
