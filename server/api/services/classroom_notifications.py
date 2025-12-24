"""
Classroom Notification Service

Utility functions to send notifications for classroom events.
"""

from .notification_models import NotificationLog


def send_notification(user, ntype, title, body, data=None):
    """Create a notification log entry for a user."""
    return NotificationLog.objects.create(
        user=user,
        notification_type=ntype,
        title=title,
        body=body,
        data=data or {}
    )


def notify_class(classroom, ntype, title, body, data=None, exclude_user=None):
    """Send notification to all active members of a classroom."""
    members = classroom.memberships.filter(status='active')
    if exclude_user:
        members = members.exclude(student=exclude_user)
    
    notifications = []
    for m in members:
        notifications.append(send_notification(m.student, ntype, title, body, data))
    return notifications


# ==============================
# Trigger Functions
# ==============================

def on_assignment_created(assignment):
    """Notify class when a new assignment is created."""
    notify_class(
        assignment.classroom,
        'assignment_new',
        f"New Assignment: {assignment.title}",
        f"Due: {assignment.due_date.strftime('%b %d, %Y') if assignment.due_date else 'No deadline'}",
        {'assignment_id': assignment.id, 'classroom_id': assignment.classroom.id}
    )


def on_assignment_graded(progress):
    """Notify student when their assignment is graded."""
    send_notification(
        progress.student,
        'assignment_graded',
        f"Assignment Graded: {progress.assignment.title}",
        f"Score: {progress.score}%" if progress.score else "See feedback",
        {'assignment_id': progress.assignment.id, 'progress_id': progress.id}
    )


def on_session_reminder(session, minutes_before):
    """Notify class about an upcoming session."""
    notify_class(
        session.classroom,
        'session_reminder',
        f"Session in {minutes_before} min: {session.title}",
        f"Join at {session.scheduled_at.strftime('%H:%M')}",
        {'session_id': session.id, 'classroom_id': session.classroom.id}
    )


def on_session_starting(session):
    """Notify class that a session is now live."""
    notify_class(
        session.classroom,
        'session_starting',
        f"🔴 LIVE: {session.title}",
        "Session is starting now!",
        {'session_id': session.id, 'meeting_url': session.meeting_url}
    )


def on_membership_approved(membership):
    """Notify student that they've been approved to join a class."""
    send_notification(
        membership.student,
        'join_approved',
        f"Welcome to {membership.classroom.name}!",
        "You can now access class materials and assignments.",
        {'classroom_id': membership.classroom.id}
    )


def on_assignment_due_soon(assignment, hours_left=24):
    """Notify students with incomplete assignments about upcoming deadline."""
    incomplete = assignment.progress.exclude(status='submitted')
    for p in incomplete:
        send_notification(
            p.student,
            'assignment_due',
            f"Due Soon: {assignment.title}",
            f"Only {hours_left}h left to submit!",
            {'assignment_id': assignment.id}
        )
