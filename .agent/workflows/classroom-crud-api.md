---
description: Create Classroom CRUD API endpoints (create, list, update, delete, get)
---

# Classroom CRUD API Workflow

Create complete CRUD operations for Classroom management.

## Prerequisites
- `/classroom-models` completed
- `/classroom-teacher-role` completed

## Dependencies
- `server/api/models.py` - Classroom model
- `server/api/serializers.py` - ClassroomSerializer
- `server/api/permissions.py` - IsTeacher permission

---

## Step 1: Create Classroom ViewSet

Create `server/api/views/classroom_views.py`:

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from api.models import Classroom, ClassMembership
from api.serializers import ClassroomSerializer, ClassroomDetailSerializer
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
        
        # Teachers see their own classrooms
        if hasattr(user, 'teacher_profile'):
            if self.request.query_params.get('role') == 'student':
                # Teacher viewing as student (enrolled classrooms)
                return Classroom.objects.filter(
                    memberships__student=user,
                    memberships__status='active'
                )
            return user.teacher_profile.classrooms.all()
        
        # Students see enrolled classrooms only
        return Classroom.objects.filter(
            memberships__student=user,
            memberships__status='active'
        )
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsTeacher()]
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
        )
        serializer = self.get_serializer(classrooms, many=True)
        return Response(serializer.data)
```

---

## Step 2: Create Detail Serializer

Add to `server/api/serializers.py`:

```python
class ClassroomDetailSerializer(ClassroomSerializer):
    """Extended serializer with more details for single classroom view."""
    students = serializers.SerializerMethodField()
    pending_requests = serializers.SerializerMethodField()
    
    class Meta(ClassroomSerializer.Meta):
        fields = ClassroomSerializer.Meta.fields + ['students', 'pending_requests']
    
    def get_students(self, obj):
        memberships = obj.memberships.filter(status='active').select_related('student')
        return [
            {
                'id': m.student.id,
                'username': m.student.username,
                'email': m.student.email,
                'joined_at': m.joined_at
            }
            for m in memberships
        ]
    
    def get_pending_requests(self, obj):
        # Only show to teacher
        request = self.context.get('request')
        if request and hasattr(request.user, 'teacher_profile'):
            if obj.teacher.user == request.user:
                pending = obj.memberships.filter(status='pending').select_related('student')
                return [
                    {
                        'id': m.id,
                        'student_id': m.student.id,
                        'username': m.student.username,
                        'email': m.student.email,
                        'requested_at': m.joined_at
                    }
                    for m in pending
                ]
        return []
```

---

## Step 3: Register URLs

Add to `server/api/urls.py`:

```python
from rest_framework.routers import DefaultRouter
from api.views.classroom_views import ClassroomViewSet

router = DefaultRouter()
router.register(r'classrooms', ClassroomViewSet, basename='classroom')

urlpatterns = [
    # ... existing urls ...
    path('', include(router.urls)),
]
```

---

## API Endpoints Created

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/classrooms/` | GET | List classrooms (teacher's or enrolled) |
| `/api/classrooms/` | POST | Create new classroom (teacher only) |
| `/api/classrooms/{id}/` | GET | Get classroom details |
| `/api/classrooms/{id}/` | PUT/PATCH | Update classroom (owner only) |
| `/api/classrooms/{id}/` | DELETE | Delete classroom (owner only) |
| `/api/classrooms/{id}/regenerate_invite/` | POST | Get new invite code |
| `/api/classrooms/{id}/toggle_active/` | POST | Activate/deactivate |
| `/api/classrooms/my_teaching/` | GET | Classrooms I teach |
| `/api/classrooms/my_enrolled/` | GET | Classrooms I'm enrolled in |

---

## Verification

1. Create classroom:
   ```bash
   curl -X POST http://localhost:8000/api/classrooms/ \
     -H "Authorization: Token YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name": "German B1 Evening", "level": "B1", "description": "Beginner friendly"}'
   ```

2. List classrooms:
   ```bash
   curl http://localhost:8000/api/classrooms/ \
     -H "Authorization: Token YOUR_TOKEN"
   ```

3. Get classroom detail:
   ```bash
   curl http://localhost:8000/api/classrooms/1/ \
     -H "Authorization: Token YOUR_TOKEN"
   ```

4. Regenerate invite:
   ```bash
   curl -X POST http://localhost:8000/api/classrooms/1/regenerate_invite/ \
     -H "Authorization: Token YOUR_TOKEN"
   ```

---

## Output
- New file: `server/api/views/classroom_views.py`
- Updated: `server/api/serializers.py`
- Updated: `server/api/urls.py`
- 9 new API endpoints

## Next Workflow
→ `/classroom-invite-system`
