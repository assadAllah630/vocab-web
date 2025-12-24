---
description: Push notifications for assignments, sessions, alerts, and engagement
---

# Classroom Notifications

## Prerequisites
- `/assignment-models` ✅
- `/live-session-models` ✅

## Notification Types

| Type | Trigger | Priority | Recipients |
|------|---------|----------|------------|
| `assignment_new` | Teacher creates | Medium | Class students |
| `assignment_due` | 24h before due | High | Student |
| `assignment_graded` | Teacher grades | Medium | Student |
| `session_reminder` | 30min/1hr before | High | Class students |
| `session_starting` | Teacher starts | High | Class students |
| `join_approved` | Teacher approves | Medium | Student |
| `new_content` | Teacher shares | Low | Class students |
| `achievement` | Milestone reached | Low | Student |
| `streak_risk` | Inactive 2+ days | Medium | Student |

## Model

```python
class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    
    TYPES = [('assignment_new','New Assignment'),('assignment_due','Due Soon'),
             ('assignment_graded','Graded'),('session_reminder','Session Reminder'),
             ('join_approved','Join Approved'),('achievement','Achievement')]
    notification_type = models.CharField(max_length=30, choices=TYPES)
    
    title = models.CharField(max_length=200)
    body = models.TextField()
    data = models.JSONField(default=dict)  # {classroom_id, assignment_id, etc.}
    
    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True)
    
    # Delivery
    sent_push = models.BooleanField(default=False)
    sent_email = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['user', 'is_read', '-created_at'])]
```

## Service: `services/notifications.py`

```python
from firebase_admin import messaging  # or OneSignal, etc.

def send_notification(user, ntype, title, body, data=None):
    """Create and optionally push a notification."""
    notif = Notification.objects.create(
        user=user, notification_type=ntype,
        title=title, body=body, data=data or {}
    )
    
    # Push if user has device token
    if hasattr(user, 'push_tokens'):
        for token in user.push_tokens.all():
            try:
                send_push(token.token, title, body, data)
                notif.sent_push = True
            except:
                pass
    
    notif.save()
    return notif

def notify_class(classroom, ntype, title, body, data=None, exclude_teacher=True):
    """Send notification to all class members."""
    members = classroom.memberships.filter(status='active')
    for m in members:
        send_notification(m.student, ntype, title, body, data)

# Trigger functions
def on_assignment_created(assignment):
    notify_class(
        assignment.classroom, 'assignment_new',
        f"New Assignment: {assignment.title}",
        f"Due: {assignment.due_date.strftime('%b %d')}",
        {'assignment_id': assignment.id}
    )
```

## API Endpoints

```python
GET  /notifications/             # List my notifications
POST /notifications/read/        # Mark as read (ids in body)
POST /notifications/read-all/    # Mark all as read
GET  /notifications/unread-count/  # Badge count
POST /notifications/settings/    # Update preferences
```

## Push Token Management

```python
class PushToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='push_tokens')
    token = models.TextField()
    platform = models.CharField(max_length=10)  # ios, android, web
    created_at = models.DateTimeField(auto_now_add=True)
```

## Frontend: `NotificationBell.jsx`
- Bell icon with unread count badge
- Dropdown list of recent notifications
- Click → mark read + navigate to target
- Settings modal for preferences

## Next → `/classroom-mobile-optimize`
