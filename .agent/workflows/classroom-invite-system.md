---
description: Create invite code system for students to join classrooms
---

# Classroom Invite System Workflow

Create the invite code generation and join flow for classrooms.

## Prerequisites
- `/classroom-models` completed
- `/classroom-teacher-role` completed
- `/classroom-crud-api` completed

## Dependencies
- `server/api/models.py` - Classroom, ClassMembership
- `server/api/views/classroom_views.py`

---

## Step 1: Add Invite Validation Endpoint

Add to `server/api/views/classroom_views.py`:

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


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
        return Response(
            {'valid': False, 'error': 'Invalid or expired invite code'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if already enrolled
    existing = ClassMembership.objects.filter(
        classroom=classroom,
        student=request.user
    ).first()
    
    if existing:
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
        elif existing.status == 'removed':
            return Response(
                {'error': 'You have been removed from this classroom'},
                status=status.HTTP_403_FORBIDDEN
            )
        else:
            # Paused - reactivate
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
```

---

## Step 2: Add Share Link Generator

Add to `server/api/views/classroom_views.py`:

```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_share_link(request, classroom_id):
    """
    Get shareable link for classroom invite.
    Only classroom teacher can get this.
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
```

---

## Step 3: Add Email Invite (Optional)

Add to `server/api/views/classroom_views.py`:

```python
from django.core.mail import send_mail
from django.conf import settings


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
```

---

## Step 4: Register URLs

Add to `server/api/urls.py`:

```python
from api.views.classroom_views import (
    validate_invite_code, 
    join_with_code,
    get_share_link,
    send_invite_emails
)

# Invite system routes
path('classrooms/validate/<str:code>/', validate_invite_code, name='validate-invite'),
path('classrooms/join/', join_with_code, name='join-classroom'),
path('classrooms/<int:classroom_id>/share-link/', get_share_link, name='share-link'),
path('classrooms/<int:classroom_id>/send-invites/', send_invite_emails, name='send-invites'),
```

---

## API Endpoints Created

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/classrooms/validate/{code}/` | GET | Validate invite code, get classroom info |
| `/api/classrooms/join/` | POST | Join classroom with invite code |
| `/api/classrooms/{id}/share-link/` | GET | Get shareable link (teacher only) |
| `/api/classrooms/{id}/send-invites/` | POST | Send email invitations (teacher only) |

---

## Verification

1. Validate code:
   ```bash
   curl http://localhost:8000/api/classrooms/validate/ABC12345/ \
     -H "Authorization: Token YOUR_TOKEN"
   ```

2. Join classroom:
   ```bash
   curl -X POST http://localhost:8000/api/classrooms/join/ \
     -H "Authorization: Token YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"invite_code": "ABC12345"}'
   ```

3. Get share link (as teacher):
   ```bash
   curl http://localhost:8000/api/classrooms/1/share-link/ \
     -H "Authorization: Token TEACHER_TOKEN"
   ```

---

## Output
- Updated: `server/api/views/classroom_views.py`
- Updated: `server/api/urls.py`
- 4 new API endpoints

## Next Workflow
→ `/classroom-membership-api`
