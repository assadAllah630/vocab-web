---
description: Create membership management API for student enrollment, approval, and status changes
---

# Classroom Membership API Workflow

Create endpoints for managing student memberships in classrooms.

## Prerequisites
- `/classroom-models` completed
- `/classroom-teacher-role` completed
- `/classroom-crud-api` completed
- `/classroom-invite-system` completed

## Dependencies
- `server/api/models.py` - ClassMembership
- `server/api/views/classroom_views.py`

---

## Step 1: Create Membership ViewSet

Add to `server/api/views/classroom_views.py`:

```python
class ClassMembershipViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing classroom memberships.
    
    Teachers can approve, remove, pause students.
    Students can leave classrooms.
    """
    serializer_class = ClassMembershipSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        classroom_id = self.kwargs.get('classroom_id')
        
        if classroom_id:
            # Nested route: /classrooms/{id}/students/
            return ClassMembership.objects.filter(
                classroom_id=classroom_id
            ).select_related('student', 'classroom')
        
        # Direct route: /memberships/ - user's own memberships
        return ClassMembership.objects.filter(
            student=self.request.user
        ).select_related('classroom')
    
    def get_permissions(self):
        # Only teachers can approve/remove
        if self.action in ['approve', 'reject', 'remove', 'pause']:
            return [IsAuthenticated(), IsTeacher()]
        return [IsAuthenticated()]


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
    
    # TODO: Send notification to student
    
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
        membership = ClassMembership.objects.get(
            classroom_id=classroom_id,
            student=request.user,
            status__in=['active', 'pending']
        )
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
```

---

## Step 2: Register URLs

Add to `server/api/urls.py`:

```python
from api.views.classroom_views import (
    list_classroom_students,
    approve_membership,
    reject_membership,
    remove_student,
    pause_student,
    reactivate_student,
    leave_classroom,
    pending_requests
)

# Membership management routes
path('classrooms/<int:classroom_id>/students/', list_classroom_students, name='classroom-students'),
path('classrooms/<int:classroom_id>/students/pending/', pending_requests, name='pending-requests'),
path('classrooms/<int:classroom_id>/students/<int:membership_id>/approve/', approve_membership, name='approve-membership'),
path('classrooms/<int:classroom_id>/students/<int:membership_id>/reject/', reject_membership, name='reject-membership'),
path('classrooms/<int:classroom_id>/students/<int:student_id>/remove/', remove_student, name='remove-student'),
path('classrooms/<int:classroom_id>/students/<int:student_id>/pause/', pause_student, name='pause-student'),
path('classrooms/<int:classroom_id>/students/<int:student_id>/reactivate/', reactivate_student, name='reactivate-student'),
path('classrooms/<int:classroom_id>/leave/', leave_classroom, name='leave-classroom'),
```

---

## API Endpoints Created

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/classrooms/{id}/students/` | GET | List all students in classroom |
| `/api/classrooms/{id}/students/pending/` | GET | List pending join requests |
| `/api/classrooms/{id}/students/{mid}/approve/` | POST | Approve pending request |
| `/api/classrooms/{id}/students/{mid}/reject/` | POST | Reject pending request |
| `/api/classrooms/{id}/students/{sid}/remove/` | POST | Remove student from class |
| `/api/classrooms/{id}/students/{sid}/pause/` | POST | Pause student membership |
| `/api/classrooms/{id}/students/{sid}/reactivate/` | POST | Reactivate paused student |
| `/api/classrooms/{id}/leave/` | POST | Student leaves classroom |

---

## Verification

1. List students (as teacher):
   ```bash
   curl http://localhost:8000/api/classrooms/1/students/ \
     -H "Authorization: Token TEACHER_TOKEN"
   ```

2. View pending requests:
   ```bash
   curl http://localhost:8000/api/classrooms/1/students/pending/ \
     -H "Authorization: Token TEACHER_TOKEN"
   ```

3. Approve a request:
   ```bash
   curl -X POST http://localhost:8000/api/classrooms/1/students/5/approve/ \
     -H "Authorization: Token TEACHER_TOKEN"
   ```

4. Student leaves:
   ```bash
   curl -X POST http://localhost:8000/api/classrooms/1/leave/ \
     -H "Authorization: Token STUDENT_TOKEN"
   ```

---

## Output
- Updated: `server/api/views/classroom_views.py`
- Updated: `server/api/urls.py`
- 8 new API endpoints

## Next Workflow
→ `/classroom-frontend-teacher` (Frontend for teachers)
