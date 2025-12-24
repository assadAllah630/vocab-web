"""
Custom permissions for VocabMaster API.
"""
from rest_framework.permissions import BasePermission


class IsTeacher(BasePermission):
    """
    Permission check for teacher role.
    Requires user to have a teacher_profile.
    """
    message = 'You must be a teacher to perform this action.'
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            hasattr(request.user, 'teacher_profile')
        )


class IsTeacherOrReadOnly(BasePermission):
    """
    Teachers can edit, others can only read.
    """
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return request.user.is_authenticated
        return (
            request.user.is_authenticated and 
            hasattr(request.user, 'teacher_profile')
        )


class IsClassroomTeacher(BasePermission):
    """
    Only the teacher who owns the classroom can modify it.
    """
    message = 'You must be the classroom teacher to perform this action.'
    
    def has_object_permission(self, request, view, obj):
        # obj is Classroom
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return request.user.is_authenticated
        return (
            request.user.is_authenticated and 
            hasattr(request.user, 'teacher_profile') and
            obj.teacher == request.user.teacher_profile
        )
