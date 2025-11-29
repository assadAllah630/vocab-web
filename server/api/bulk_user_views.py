"""
Bulk user management endpoints for admin panel
"""
from rest_framework import views, status
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Q, Count, Avg
from datetime import timedelta
from django.utils import timezone
from .admin_permissions import require_permission, log_admin_action
from .admin_models import AdminAuditLog, UserActivityLog
from .models import Vocabulary, UserProgress
import csv
from django.http import HttpResponse


class BulkUserActionsView(views.APIView):
    """Bulk operations on users"""
    
    @require_permission('bulk_user_actions')
    @log_admin_action('bulk_user_action', 'user')
    def post(self, request):
        action = request.data.get('action')
        user_ids = request.data.get('user_ids', [])
        
        if not action or not user_ids:
            return Response(
                {'error': 'action and user_ids required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        users = User.objects.filter(id__in=user_ids)
        count = users.count()
        
        if action == 'suspend':
            users.update(is_active=False)
            message = f'Suspended {count} users'
        elif action == 'activate':
            users.update(is_active=True)
            message = f'Activated {count} users'
        elif action == 'delete':
            users.delete()
            message = f'Deleted {count} users'
        else:
            return Response(
                {'error': 'Invalid action'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({'message': message, 'count': count})


class AdvancedUserFilterView(views.APIView):
    """Advanced user filtering with multiple criteria"""
    
    @require_permission('view_users')
    def get(self, request):
        users = User.objects.all()
        
        # Filter by activity
        activity_filter = request.query_params.get('activity')
        if activity_filter == 'inactive_30':
            cutoff = timezone.now() - timedelta(days=30)
            users = users.filter(Q(last_login__lt=cutoff) | Q(last_login__isnull=True))
        elif activity_filter == 'active_7':
            cutoff = timezone.now() - timedelta(days=7)
            users = users.filter(last_login__gte=cutoff)
        
        # Filter by signup date
        signup_from = request.query_params.get('signup_from')
        signup_to = request.query_params.get('signup_to')
        if signup_from:
            users = users.filter(date_joined__gte=signup_from)
        if signup_to:
            users = users.filter(date_joined__lte=signup_to)
        
        # Filter by vocabulary count
        min_vocab = request.query_params.get('min_vocab')
        if min_vocab:
            users = users.annotate(
                vocab_count=Count('vocabulary')
            ).filter(vocab_count__gte=int(min_vocab))
        
        # Add user insights
        users_data = []
        now = timezone.now()
        for user in users[:100]:  # Limit to 100 for performance
            vocab_count = Vocabulary.objects.filter(created_by=user).count()
            last_activity = UserActivityLog.objects.filter(user=user).order_by('-timestamp').first()
            
            # Calculate is_online - user active within last 15 minutes
            is_online = False
            if user.last_login:
                is_online = (now - user.last_login) < timedelta(minutes=15)
            
            users_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_active': user.is_active,
                'date_joined': user.date_joined,
                'last_login': user.last_login,
                'is_online': is_online,
                'vocab_count': vocab_count,
                'content_count': 0,  # Placeholder, can be calculated if needed
                'last_activity': last_activity.timestamp if last_activity else None,
                'last_activity_type': last_activity.action if last_activity else None
            })
        
        return Response({
            'count': users.count(),
            'results': users_data
        })


class UserExportView(views.APIView):
    """Export users to CSV"""
    
    @require_permission('export_data')
    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="users_export.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['ID', 'Username', 'Email', 'Active', 'Date Joined', 'Last Login', 'Vocabulary Count'])
        
        users = User.objects.all().select_related('profile')
        for user in users:
            vocab_count = Vocabulary.objects.filter(created_by=user).count()
            writer.writerow([
                user.id,
                user.username,
                user.email,
                user.is_active,
                user.date_joined,
                user.last_login,
                vocab_count
            ])
        
        return response


class UserActivityTimelineView(views.APIView):
    """Get detailed activity timeline for a user"""
    
    @require_permission('view_users')
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all activity logs
        activities = UserActivityLog.objects.filter(user=user).order_by('-timestamp')[:50]
        
        timeline = [{
            'timestamp': activity.timestamp,
            'action': activity.action,
            'details': activity.details,
            'ip_address': activity.ip_address
        } for activity in activities]
        
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            },
            'timeline': timeline
        })


class UserQuickActionsView(views.APIView):
    """Quick actions for user management"""
    
    @require_permission('edit_users')
    @log_admin_action('user_quick_action', 'user')
    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        action = request.data.get('action')
        
        if action == 'reset_password':
            # Generate random password
            import random
            import string
            new_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
            user.set_password(new_password)
            user.save()
            return Response({
                'message': 'Password reset successfully',
                'new_password': new_password
            })
        
        elif action == 'send_email':
            subject = request.data.get('subject')
            message = request.data.get('message')
            # TODO: Implement email sending
            return Response({'message': 'Email sent (not implemented yet)'})
        
        else:
            return Response(
                {'error': 'Invalid action'},
                status=status.HTTP_400_BAD_REQUEST
            )
