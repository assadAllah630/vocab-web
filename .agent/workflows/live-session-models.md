---
description: Create LiveSession, attendance, and scheduling models
---

# Live Session Models

## Prerequisites
- `/classroom-models` ✅

## Concept
**Live Sessions** = Scheduled video calls, webinars, or in-person classes that teachers create for their classrooms.

## Models

```python
class LiveSession(models.Model):
    """Scheduled live class or meeting."""
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='sessions')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Scheduling
    scheduled_at = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    timezone = models.CharField(max_length=50, default='UTC')
    
    # Meeting details
    SESSION_TYPES = [
        ('video', 'Video Call'),
        ('audio', 'Audio Only'),
        ('in_person', 'In Person'),
        ('hybrid', 'Hybrid'),
    ]
    session_type = models.CharField(max_length=20, choices=SESSION_TYPES, default='video')
    
    # External meeting link (Zoom, Meet, etc.)
    meeting_url = models.URLField(blank=True)
    meeting_id = models.CharField(max_length=100, blank=True)
    meeting_password = models.CharField(max_length=50, blank=True)
    
    # Status
    STATUS = [('scheduled','Scheduled'),('live','Live'),
              ('completed','Completed'),('cancelled','Cancelled')]
    status = models.CharField(max_length=20, default='scheduled')
    
    # Attachments
    materials = models.JSONField(default=list)  # [{type, content_id, title}]
    
    # Recording
    recording_url = models.URLField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['scheduled_at']


class SessionAttendance(models.Model):
    """Track who attended a session."""
    session = models.ForeignKey(LiveSession, on_delete=models.CASCADE, related_name='attendance')
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    
    STATUS = [('registered','Registered'),('attended','Attended'),
              ('absent','Absent'),('excused','Excused')]
    status = models.CharField(max_length=20, default='registered')
    
    joined_at = models.DateTimeField(null=True)
    left_at = models.DateTimeField(null=True)
    duration_minutes = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ['session', 'student']


class SessionReminder(models.Model):
    """Scheduled reminders for sessions."""
    session = models.ForeignKey(LiveSession, on_delete=models.CASCADE)
    remind_before_minutes = models.IntegerField(default=30)
    sent_at = models.DateTimeField(null=True)
    
    class Meta:
        unique_together = ['session', 'remind_before_minutes']
```

## API Endpoints

```python
# CRUD
router.register(r'sessions', LiveSessionViewSet)

# Additional
POST /sessions/{id}/start/        # Teacher starts session
POST /sessions/{id}/end/          # Teacher ends session
POST /sessions/{id}/join/         # Student joins
POST /sessions/{id}/leave/        # Student leaves
GET  /sessions/{id}/attendance/   # Attendance report
GET  /sessions/upcoming/          # My upcoming sessions
```

## Background Tasks (Celery)

```python
@shared_task
def send_session_reminders():
    """Run every 5 minutes to send upcoming session reminders."""
    now = timezone.now()
    upcoming = LiveSession.objects.filter(
        status='scheduled',
        scheduled_at__gt=now,
        scheduled_at__lte=now + timedelta(minutes=35)
    )
    for session in upcoming:
        for reminder in session.reminders.filter(sent_at__isnull=True):
            if session.scheduled_at - timedelta(minutes=reminder.remind_before_minutes) <= now:
                send_reminder_notification(session, reminder)
                reminder.sent_at = now
                reminder.save()
```

## Next → `/live-session-frontend`
