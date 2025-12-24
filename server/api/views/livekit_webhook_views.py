"""
Livekit Webhook Handler.

Handles events from Livekit Cloud:
- participant_joined: Track when a student joins a session
- participant_left: Track when a student leaves and calculate duration
- room_finished: Update session status when room closes
"""
import json
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.utils import timezone
from django.contrib.auth.models import User

from ..models import LiveSession, SessionAttendance
from ..services.livekit_service import livekit_service

logger = logging.getLogger(__name__)


@csrf_exempt
@require_POST
def livekit_webhook(request):
    """
    Handle webhook events from Livekit Cloud.
    
    Events handled:
    - participant_joined: When someone joins a room
    - participant_left: When someone leaves a room
    - room_finished: When a room is closed
    """
    # Verify webhook authenticity
    auth_header = request.headers.get('Authorization', '')
    
    # Note: In production, uncomment this verification
    # if not livekit_service.verify_webhook(request.body, auth_header):
    #     logger.warning("Invalid Livekit webhook signature")
    #     return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    try:
        event = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    
    event_type = event.get('event')
    
    logger.info(f"Livekit webhook received: {event_type}")
    
    if event_type == 'participant_joined':
        handle_participant_joined(event)
    elif event_type == 'participant_left':
        handle_participant_left(event)
    elif event_type == 'room_finished':
        handle_room_finished(event)
    else:
        logger.debug(f"Unhandled event type: {event_type}")
    
    return JsonResponse({'status': 'ok'})


def handle_participant_joined(event: dict):
    """Handle participant_joined event."""
    try:
        room_info = event.get('room', {})
        participant_info = event.get('participant', {})
        
        room_name = room_info.get('name', '')
        participant_identity = participant_info.get('identity', '')
        
        # Room name format: session_{id}
        if not room_name.startswith('session_'):
            logger.debug(f"Ignoring non-session room: {room_name}")
            return
        
        session_id = int(room_name.split('_')[1])
        
        # Find the session and user
        try:
            session = LiveSession.objects.get(id=session_id)
        except LiveSession.DoesNotExist:
            logger.warning(f"Session not found: {session_id}")
            return
        
        # Try to find user by username or user ID
        user = None
        if participant_identity.isdigit():
            user = User.objects.filter(id=int(participant_identity)).first()
        if not user:
            user = User.objects.filter(username=participant_identity).first()
        
        if not user:
            logger.warning(f"User not found: {participant_identity}")
            return
        
        # Create or update attendance record
        attendance, created = SessionAttendance.objects.get_or_create(
            session=session,
            student=user,
            defaults={
                'status': 'attended',
                'joined_at': timezone.now()
            }
        )
        
        if not created and not attendance.joined_at:
            # Re-joining after leaving
            attendance.joined_at = timezone.now()
            attendance.status = 'attended'
            attendance.save()
        
        logger.info(f"Participant joined: {user.username} -> session {session_id}")
        
        # Update session status to live if not already
        if session.status == 'scheduled':
            session.status = 'live'
            session.save()
            
    except Exception as e:
        logger.exception(f"Error handling participant_joined: {e}")


def handle_participant_left(event: dict):
    """Handle participant_left event."""
    try:
        room_info = event.get('room', {})
        participant_info = event.get('participant', {})
        
        room_name = room_info.get('name', '')
        participant_identity = participant_info.get('identity', '')
        
        if not room_name.startswith('session_'):
            return
        
        session_id = int(room_name.split('_')[1])
        
        # Find user
        user = None
        if participant_identity.isdigit():
            user = User.objects.filter(id=int(participant_identity)).first()
        if not user:
            user = User.objects.filter(username=participant_identity).first()
        
        if not user:
            return
        
        # Update attendance record
        attendance = SessionAttendance.objects.filter(
            session_id=session_id,
            student=user
        ).first()
        
        if attendance and attendance.joined_at:
            attendance.left_at = timezone.now()
            
            # Calculate duration in minutes
            duration = (attendance.left_at - attendance.joined_at).total_seconds() / 60
            attendance.duration_minutes = int(duration)
            attendance.save()
            
            logger.info(f"Participant left: {user.username} (duration: {attendance.duration_minutes} min)")
            
    except Exception as e:
        logger.exception(f"Error handling participant_left: {e}")


def handle_room_finished(event: dict):
    """Handle room_finished event."""
    try:
        room_info = event.get('room', {})
        room_name = room_info.get('name', '')
        
        if not room_name.startswith('session_'):
            return
        
        session_id = int(room_name.split('_')[1])
        
        # Update session status to completed
        session = LiveSession.objects.filter(id=session_id).first()
        if session and session.status in ['scheduled', 'live']:
            session.status = 'completed'
            session.save()
            
            logger.info(f"Session completed: {session_id}")
            
            # Mark any remaining attendees as having left
            now = timezone.now()
            for attendance in session.attendance.filter(left_at__isnull=True, joined_at__isnull=False):
                attendance.left_at = now
                duration = (now - attendance.joined_at).total_seconds() / 60
                attendance.duration_minutes = int(duration)
                attendance.save()
                
    except Exception as e:
        logger.exception(f"Error handling room_finished: {e}")
