---
description: Add teacher role to authentication system and create upgrade-to-teacher flow
---

# Teacher Role Workflow

Add teacher role capability to existing users and create the upgrade flow.

## Prerequisites
- `/classroom-models` completed

## Dependencies
- `server/api/models.py` - Teacher model exists
- `server/api/views/auth_views.py` (existing auth)
- `server/api/serializers.py`

---

## Step 1: Add is_teacher Property to UserProfile

Update `server/api/models.py` - add to `UserProfile` model:

```python
@property
def is_teacher(self):
    """Check if user has a teacher profile."""
    return hasattr(self.user, 'teacher_profile')

@property  
def teacher(self):
    """Get teacher profile if exists."""
    return getattr(self.user, 'teacher_profile', None)
```

---

## Step 2: Create Teacher Views

Create `server/api/views/teacher_views.py`:

```python
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from api.models import Teacher
from api.serializers import TeacherSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def become_teacher(request):
    """Upgrade current user to teacher role."""
    user = request.user
    
    # Check if already a teacher
    if hasattr(user, 'teacher_profile'):
        return Response(
            {'error': 'You are already a teacher'},
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
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_teacher_profile(request):
    """Get current user's teacher profile."""
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
    """Update current user's teacher profile."""
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
    """Quick check if user is a teacher."""
    is_teacher = hasattr(request.user, 'teacher_profile')
    return Response({
        'is_teacher': is_teacher,
        'classroom_count': request.user.teacher_profile.classrooms.count() if is_teacher else 0
    })
```

---

## Step 3: Add URLs

Add to `server/api/urls.py`:

```python
from api.views import teacher_views

# Teacher routes
path('teachers/become/', teacher_views.become_teacher, name='become-teacher'),
path('teachers/me/', teacher_views.get_teacher_profile, name='teacher-profile'),
path('teachers/me/update/', teacher_views.update_teacher_profile, name='update-teacher'),
path('teachers/status/', teacher_views.check_teacher_status, name='teacher-status'),
```

---

## Step 4: Update User Profile Response

Update the user profile endpoint to include teacher status.

In `server/api/views/auth_views.py` or `feature_views.py`, find the profile endpoint and add:

```python
# In profile response, add:
'is_teacher': hasattr(user, 'teacher_profile'),
'teacher_profile': TeacherSerializer(user.teacher_profile).data if hasattr(user, 'teacher_profile') else None,
```

---

## Step 5: Create IsTeacher Permission

Add to `server/api/permissions.py` (create if doesn't exist):

```python
from rest_framework.permissions import BasePermission


class IsTeacher(BasePermission):
    """
    Permission check for teacher role.
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
```

---

## API Endpoints Created

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/teachers/become/` | POST | Upgrade to teacher |
| `/api/teachers/me/` | GET | Get teacher profile |
| `/api/teachers/me/update/` | PUT/PATCH | Update teacher profile |
| `/api/teachers/status/` | GET | Quick teacher check |

---

## Verification

1. Test become teacher:
   ```bash
   curl -X POST http://localhost:8000/api/teachers/become/ \
     -H "Authorization: Token YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"organization_name": "My School", "subjects": ["German"]}'
   ```

2. Test get profile:
   ```bash
   curl http://localhost:8000/api/teachers/me/ \
     -H "Authorization: Token YOUR_TOKEN"
   ```

3. Test status check:
   ```bash
   curl http://localhost:8000/api/teachers/status/ \
     -H "Authorization: Token YOUR_TOKEN"
   ```

---

## Output
- New file: `server/api/views/teacher_views.py`
- New file: `server/api/permissions.py`
- Updated: `server/api/urls.py`
- 4 new API endpoints

## Next Workflow
→ `/classroom-crud-api`
