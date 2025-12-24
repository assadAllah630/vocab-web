from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.db import connection
from ..models import AssignmentProgress, ClassMembership

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """
    Health check endpoint for monitoring.
    Returns 200 if application is healthy, 503 if not.
    """
    
    health_status = {
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'checks': {}
    }
    
    # Check database connectivity
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status['checks']['database'] = 'ok'
    except Exception as e:
        health_status['status'] = 'unhealthy'
        health_status['checks']['database'] = f'error: {str(e)}'
        return Response(health_status, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    # Check cache (if configured)
    try:
        from django.core.cache import cache
        cache.set('health_check', 'ok', 10)
        if cache.get('health_check') == 'ok':
            health_status['checks']['cache'] = 'ok'
        else:
            health_status['checks']['cache'] = 'degraded'
    except:
        health_status['checks']['cache'] = 'not_configured'
    
    return Response(health_status, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_activity_feed(request):
    """
    Unified activity feed for platform admins.
    Shows global submissions, joins, and teacher actions.
    """
    activity = []
    limit = 50
    
    # 1. Global Submissions
    submissions = AssignmentProgress.objects.filter(
        status__in=['submitted', 'graded']
    ).select_related('student', 'assignment', 'assignment__classroom').order_by('-submitted_at')[:limit]
    
    for sub in submissions:
        activity.append({
            'type': 'submission',
            'timestamp': sub.submitted_at,
            'user_name': sub.student.username,
            'action': "submitted an assignment",
            'subject': sub.assignment.title,
            'context': sub.assignment.classroom.name,
            'icon': 'clipboard'
        })
        
    # 2. Global Joins
    joins = ClassMembership.objects.select_related('student', 'classroom').order_by('-joined_at')[:limit]
    
    for join in joins:
        activity.append({
            'type': 'join',
            'timestamp': join.joined_at,
            'user_name': join.student.username,
            'action': "joined a classroom" if join.status == 'active' else "requested to join",
            'subject': join.classroom.name,
            'context': f"Teacher: {join.classroom.teacher.user.username}",
            'icon': 'user-plus'
        })
        
    # Sort and return
    activity.sort(key=lambda x: x['timestamp'], reverse=True)
    return Response(activity[:limit])
