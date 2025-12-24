from rest_framework import status, views, permissions
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login, logout
from django.utils import timezone
from datetime import timedelta
from .admin_models import AdminRole, AdminAuditLog
from .admin_permissions import require_permission, require_any_permission, log_admin_action
from rest_framework import serializers
from django.contrib.auth.models import User
from .pagination import StandardResultsSetPagination

class AdminUserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    vocab_count = serializers.IntegerField(read_only=True)
    content_count = serializers.IntegerField(read_only=True)
    is_online = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_active', 'date_joined', 'last_login', 'role', 'vocab_count', 'content_count', 'is_online']

    def get_role(self, obj):
        try:
            return obj.admin_role.role if hasattr(obj, 'admin_role') and obj.admin_role else 'user'
        except:
            return 'user'

    def get_is_online(self, obj):
        if not obj.last_login:
            return False
        # Online if last login was within 15 minutes
        return (timezone.now() - obj.last_login) < timedelta(minutes=15)

class AdminLoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        
        if not user:
            return Response(
                {'error': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        # Check if user has admin role
        try:
            admin_role = user.admin_role
            if not admin_role.is_active:
                return Response(
                    {'error': 'Admin account is inactive'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        except AdminRole.DoesNotExist:
            return Response(
                {'error': 'User is not an administrator'}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Login successful
        login(request, user)
        token, _ = Token.objects.get_or_create(user=user)
        
        # Log audit
        AdminAuditLog.objects.create(
            admin_user=user,
            action='admin_login',
            resource_type='auth',
            ip_address=request.META.get('REMOTE_ADDR'),
            details={'user_agent': request.META.get('HTTP_USER_AGENT', '')}
        )
        
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': admin_role.role
            }
        })

class AdminLogoutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Log audit
        AdminAuditLog.objects.create(
            admin_user=request.user,
            action='admin_logout',
            resource_type='auth',
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        request.user.auth_token.delete()
        logout(request)
        return Response({'message': 'Logged out successfully'})

class AdminMeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            admin_role = request.user.admin_role
            return Response({
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'role': admin_role.role,
                'permissions': admin_role.get_permissions()
            })
        except AdminRole.DoesNotExist:
            return Response(
                {'error': 'Not an admin'}, 
                status=status.HTTP_403_FORBIDDEN
            )

class AdminUserListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        from django.db.models import Count
        queryset = User.objects.all().annotate(
            vocab_count=Count('vocabulary', distinct=True),
            content_count=Count('generatedcontent', distinct=True)
        ).order_by('-date_joined')
        
        # Search
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(username__icontains=search) | queryset.filter(email__icontains=search)
            
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = AdminUserSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

class AdminUserDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            from django.db.models import Count
            user = User.objects.annotate(
                vocab_count=Count('vocabulary', distinct=True),
                content_count=Count('generatedcontent', distinct=True)
            ).get(pk=pk)
            serializer = AdminUserSerializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

from .models import Vocabulary, GrammarTopic
from .advanced_text_models import GeneratedContent
from .serializers import VocabularySerializer, GrammarTopicSerializer

class AdminVocabularyListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        queryset = Vocabulary.objects.all().order_by('-created_at')
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = VocabularySerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

class AdminVocabularyDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            vocab = Vocabulary.objects.get(pk=pk)
            serializer = VocabularySerializer(vocab)
            return Response(serializer.data)
        except Vocabulary.DoesNotExist:
            return Response({'error': 'Vocabulary not found'}, status=status.HTTP_404_NOT_FOUND)

class AdminGeneratedContentListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        queryset = GeneratedContent.objects.all().order_by('-created_at')
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        # Simple serialization for list
        data = [{'id': c.id, 'title': c.title, 'type': c.content_type, 'user': c.user.username, 'created_at': c.created_at} for c in page]
        return paginator.get_paginated_response(data)

class AdminGeneratedContentDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            content = GeneratedContent.objects.get(pk=pk)
            return Response({'id': content.id, 'title': content.title, 'content': content.content_data})
        except GeneratedContent.DoesNotExist:
            return Response({'error': 'Content not found'}, status=status.HTTP_404_NOT_FOUND)

class AdminGrammarTopicListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        queryset = GrammarTopic.objects.all().order_by('level', 'order')
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = GrammarTopicSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

class AdminUserActionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, action):
        try:
            user = User.objects.get(pk=pk)
            
            if action == 'suspend':
                user.is_active = False
                user.save()
                AdminAuditLog.objects.create(admin_user=request.user, action='suspend_user', resource_type='user', resource_id=user.id)
            elif action == 'unsuspend':
                user.is_active = True
                user.save()
                AdminAuditLog.objects.create(admin_user=request.user, action='unsuspend_user', resource_type='user', resource_id=user.id)
            elif action == 'reset_password':
                # Logic to send reset email or set temp password
                pass
                
            return Response({'message': f'Action {action} performed successfully'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class AdminDashboardStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        
        # Get mixed activity feed from multiple sources
        activity_feed = []
        
        # Recent user signups (last 10)
        recent_users = User.objects.all().order_by('-date_joined')[:10]
        for user in recent_users:
            activity_feed.append({
                'id': f'signup_{user.id}',
                'type': 'user_signup',
                'user': user.username,
                'action': 'signed up',
                'time': user.date_joined
            })
        
        # Recent logins (last 10 users who logged in)
        recent_logins = User.objects.filter(last_login__isnull=False).order_by('-last_login')[:10]
        for user in recent_logins:
            activity_feed.append({
                'id': f'login_{user.id}',
                'type': 'user_login',
                'user': user.username,
                'action': 'logged in',
                'time': user.last_login
            })
        
        # Recent vocabulary additions (last 10)
        recent_vocab = Vocabulary.objects.all().select_related('created_by').order_by('-created_at')[:10]
        for vocab in recent_vocab:
            activity_feed.append({
                'id': f'vocab_{vocab.id}',
                'type': 'vocab_added',
                'user': vocab.created_by.username,
                'action': f'added word "{vocab.word}"',
                'time': vocab.created_at
            })
        
        # Sort all activities by time (most recent first) and take top 10
        activity_feed = sorted(activity_feed, key=lambda x: x['time'], reverse=True)[:10]

        stats = {
            'total_users': User.objects.count(),
            'active_users_today': User.objects.filter(last_login__date=today).count(),
            'new_users_week': User.objects.filter(date_joined__gte=today - timedelta(days=7)).count(),
            'total_vocabulary': Vocabulary.objects.count(),
            'recent_activity': activity_feed
        }
        return Response(stats)

class AdminUserAnalyticsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        from datetime import timedelta
        from .admin_models import UserActivityLog
        today = timezone.now().date()
        
        # User growth over last 30 days
        growth_data = []
        for i in range(30):
            date = today - timedelta(days=29-i)
            # Total users up to this date
            total_count = User.objects.filter(date_joined__date__lte=date).count()
            
            # Active users on this specific date (unique users in logs)
            active_count = UserActivityLog.objects.filter(timestamp__date=date).values('user').distinct().count()
            
            growth_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'total_users': total_count,
                'active_users': active_count
            })
        
        return Response({
            'user_growth': growth_data,
            'total_users': User.objects.count(),
            'active_users_today': User.objects.filter(last_login__date=today).count(),
            'new_users_week': User.objects.filter(date_joined__gte=today - timedelta(days=7)).count()
        })

class AdminAIAnalyticsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        from .admin_models import APIUsageLog
        from django.db.models import Avg, Sum, Count, Q
        
        # Get REAL AI usage statistics from APIUsageLog
        api_logs = APIUsageLog.objects.all()
        
        # Total AI requests (count all API logs)
        total_ai_requests = api_logs.count()
        
        # Success rate - REAL calculation
        if total_ai_requests > 0:
            successful_requests = api_logs.filter(success=True).count()
            success_rate = (successful_requests / total_ai_requests) * 100
        else:
            success_rate = 0
        
        # Average response time - REAL calculation
        avg_response_time_ms = api_logs.aggregate(avg_time=Avg('response_time_ms'))['avg_time'] or 0
        avg_response_time = avg_response_time_ms / 1000  # Convert to seconds
        
        # Total estimated cost - REAL calculation
        total_cost = api_logs.aggregate(total_cost=Sum('estimated_cost'))['total_cost'] or 0
        
        # Provider breakdown
        provider_breakdown = {}
        for provider in ['gemini', 'openrouter', 'stable_horde', 'huggingface', 'unknown']:
            count = api_logs.filter(provider=provider).count()
            if count > 0:
                provider_breakdown[provider] = count
        
        # Content Generated vs Vocabulary Enriched (based on endpoint patterns)
        content_generated = api_logs.filter(endpoint__contains='/ai/').count()
        vocab_enriched = api_logs.filter(Q(endpoint__contains='/vocab/') | Q(endpoint__contains='semantic-search')).count()
        
        return Response({
            'total_ai_requests': total_ai_requests,
            'content_generated': content_generated,
            'vocab_enriched': vocab_enriched,
            'estimated_cost': round(total_cost, 2),
            'avg_response_time': round(avg_response_time, 2),
            'success_rate': round(success_rate, 1),
            'provider_breakdown': provider_breakdown
        })

class AdminContentAnalyticsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Content type distribution
        content_by_type = []
        for content_type in ['story', 'conversation', 'explanation']:
            count = GeneratedContent.objects.filter(content_type=content_type).count()
            content_by_type.append({
                'type': content_type,
                'count': count
            })
        
        return Response({
            'content_by_type': content_by_type,
            'total_content': GeneratedContent.objects.count(),
            'total_vocabulary': Vocabulary.objects.count()
        })

class AdminErrorLogListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        from .admin_models import APIUsageLog, AdminAuditLog
        from django.db.models import Q
        
        # Aggregate errors from different sources
        errors = []
        
        # 1. Failed AI Requests
        api_errors = APIUsageLog.objects.filter(success=False).select_related('user').order_by('-timestamp')[:50]
        for log in api_errors:
            errors.append({
                'id': f'api_{log.id}',
                'timestamp': log.timestamp,
                'action': f"AI Request: {log.provider}",
                'error': log.error_message or f"HTTP {log.response_status}",
                'user': log.user.username if log.user else 'Unknown',
                'details': f"Endpoint: {log.endpoint}\nStatus: {log.response_status}",
                'source': 'AI API'
            })
            
        # 2. Failed Admin Actions
        admin_errors = AdminAuditLog.objects.filter(success=False).select_related('admin_user').order_by('-timestamp')[:50]
        for log in admin_errors:
            errors.append({
                'id': f'admin_{log.id}',
                'timestamp': log.timestamp,
                'action': log.action,
                'error': log.error_message or "Operation failed",
                'user': log.admin_user.username if log.admin_user else 'System',
                'details': str(log.details),
                'source': 'Admin Panel'
            })
            
        # Sort combined errors by timestamp desc
        errors.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Pagination (manual for combined list)
        page_size = 20
        page_num = int(request.query_params.get('page', 1))
        start = (page_num - 1) * page_size
        end = start + page_size
        
        paginated_errors = errors[start:end]
        
        return Response({
            'count': len(errors),
            'next': page_num + 1 if end < len(errors) else None,
            'previous': page_num - 1 if page_num > 1 else None,
            'results': paginated_errors
        })

from .admin_models import SystemConfiguration

class AdminSystemConfigView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        config = SystemConfiguration.get_solo()
        return Response({
            'maintenance_mode': config.maintenance_mode,
            'allow_signups': config.allow_signups,
            'admin_ip_whitelist': config.admin_ip_whitelist,
            'updated_at': config.updated_at
        })

    def post(self, request):
        config = SystemConfiguration.get_solo()
        config.maintenance_mode = request.data.get('maintenance_mode', config.maintenance_mode)
        config.allow_signups = request.data.get('allow_signups', config.allow_signups)
        config.admin_ip_whitelist = request.data.get('admin_ip_whitelist', config.admin_ip_whitelist)
        config.updated_by = request.user
        config.save()
        
        AdminAuditLog.objects.create(
            admin_user=request.user,
            action='update_system_config',
            resource_type='system',
            details=request.data,
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response({'message': 'Configuration updated'})

class AdminUserManagementView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        admins = AdminRole.objects.all().select_related('user')
        data = [{
            'id': admin.user.id,
            'username': admin.user.username,
            'email': admin.user.email,
            'role': admin.role,
            'is_active': admin.is_active,
            'assigned_at': admin.assigned_at
        } for admin in admins]
        return Response(data)

    def post(self, request):
        username = request.data.get('username')
        role = request.data.get('role')
        
        try:
            user = User.objects.get(username=username)
            AdminRole.objects.create(user=user, role=role, assigned_by=request.user)
            return Response({'message': 'Admin added successfully'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

from .pagination import StandardResultsSetPagination

class AdminAuditLogView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        queryset = AdminAuditLog.objects.all().select_related('admin_user').order_by('-timestamp')
        
        action = request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
            
        username = request.query_params.get('username')
        if username:
            queryset = queryset.filter(admin_user__username__icontains=username)

        start_date = request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
            
        end_date = request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        
        data = [{
            'id': log.id,
            'timestamp': log.timestamp,
            'admin': log.admin_user.username if log.admin_user else 'System',
            'action': log.action,
            'resource_type': log.resource_type,
            'details': log.details,
            'ip_address': log.ip_address,
            'success': log.success
        } for log in page]
        
        return paginator.get_paginated_response(data)
