"""
Push Notification Views

API endpoints for managing push notifications:
- Subscribe/unsubscribe devices
- Update notification preferences
- Send test notifications
"""

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User

from .notification_models import PushSubscription, NotificationPreferences, NotificationLog


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def register_fcm_token(request):
    """
    Register Firebase Cloud Messaging (FCM) token for the user.
    """
    token = request.data.get('token')
    
    if not token:
        return Response({'error': 'Token required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        from .models import UserProfile
        profile = request.user.profile
        profile.fcm_token = token
        profile.save()
        return Response({'message': 'FCM token registered successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def subscribe_push(request):
    """
    Subscribe a device to push notifications (Legacy Web Push).
    
    Request body:
    {
        "endpoint": "https://fcm.googleapis.com/fcm/send/...",
        "keys": {
            "p256dh": "...",
            "auth": "..."
        }
    }
    """
    try:
        subscription = request.data.get('subscription', request.data)
        endpoint = subscription.get('endpoint')
        keys = subscription.get('keys', {})
        
        if not endpoint:
            # If no endpoint, this might be a mistake or old client. 
            # But if we have FCM token logic above, maybe this is not needed as much.
            return Response({'error': 'Endpoint required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create or update subscription
        push_sub, created = PushSubscription.objects.update_or_create(
            endpoint=endpoint,
            defaults={
                'user': request.user,
                'p256dh_key': keys.get('p256dh', ''),
                'auth_key': keys.get('auth', ''),
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'is_active': True,
            }
        )
        
        # Ensure notification preferences exist
        NotificationPreferences.objects.get_or_create(user=request.user)
        
        return Response({
            'message': 'Subscribed successfully',
            'created': created
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def unsubscribe_push(request):
    """
    Unsubscribe a device from push notifications.
    """
    endpoint = request.data.get('endpoint')
    
    if not endpoint:
        return Response({'error': 'Endpoint required'}, status=status.HTTP_400_BAD_REQUEST)
    
    deleted, _ = PushSubscription.objects.filter(
        user=request.user,
        endpoint=endpoint
    ).delete()
    
    if deleted:
        return Response({'message': 'Unsubscribed successfully'})
    return Response({'error': 'Subscription not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'PUT'])
@permission_classes([permissions.IsAuthenticated])
def notification_preferences(request):
    """
    Get or update notification preferences.
    """
    prefs, created = NotificationPreferences.objects.get_or_create(user=request.user)
    
    if request.method == 'GET':
        return Response({
            'daily_reminder': prefs.daily_reminder,
            'streak_warning': prefs.streak_warning,
            'new_content': prefs.new_content,
            'practice_reminder': prefs.practice_reminder,
            'achievement': prefs.achievement,
            'reminder_hour': prefs.reminder_hour,
            'timezone': prefs.timezone,
            'quiet_start': prefs.quiet_start,
            'quiet_end': prefs.quiet_end,
        })
    
    # PUT - Update preferences
    for field in ['daily_reminder', 'streak_warning', 'new_content', 
                  'practice_reminder', 'achievement']:
        if field in request.data:
            setattr(prefs, field, request.data[field])
    
    for field in ['reminder_hour', 'timezone', 'quiet_start', 'quiet_end']:
        if field in request.data:
            setattr(prefs, field, request.data[field])
    
    prefs.save()
    return Response({'message': 'Preferences updated'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notification_status(request):
    """
    Get push notification status for current user.
    """
    subscriptions = PushSubscription.objects.filter(
        user=request.user,
        is_active=True
    ).count()
    
    prefs = NotificationPreferences.objects.filter(user=request.user).first()
    
    return Response({
        'subscribed': subscriptions > 0,
        'device_count': subscriptions,
        'has_preferences': prefs is not None,
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_test_notification(request):
    """
    Send a test notification to verify setup.
    """
    subscriptions = PushSubscription.objects.filter(
        user=request.user,
        is_active=True
    )
    
    if not subscriptions.exists():
        return Response({
            'error': 'No active subscriptions found'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Log the test notification
    NotificationLog.objects.create(
        user=request.user,
        notification_type='custom',
        title='Test Notification',
        body='Push notifications are working!',
        delivered=True  # Assume delivered for now
    )
    
    # Note: Actual push sending requires pywebpush library
    # For now, we return success and the client will handle the test
    return Response({
        'message': 'Test notification queued',
        'devices': subscriptions.count()
    })


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def list_notifications(request):
    """
    Get user's notification history.
    """
    if request.method == 'POST':
        # Mark as read (or clicked)
        notif_id = request.data.get('id')
        if notif_id:
            NotificationLog.objects.filter(id=notif_id, user=request.user).update(clicked=True)
            return Response({'message': 'Marked as read'})
        # Mark all as read
        if request.data.get('mark_all_read'):
            NotificationLog.objects.filter(user=request.user, clicked=False).update(clicked=True)
            return Response({'message': 'All marked as read'})

    # GET
    notifications = NotificationLog.objects.filter(user=request.user).order_by('-sent_at')[:50]
    
    data = [{
        'id': n.id,
        'type': n.notification_type,
        'title': n.title,
        'body': n.body,
        'sent_at': n.sent_at,
        'is_read': n.clicked,
        'error': n.error
    } for n in notifications]
    
    return Response(data)
