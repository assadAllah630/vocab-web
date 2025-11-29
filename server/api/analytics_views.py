"""
Real analytics endpoints with cohort analysis and engagement metrics
"""
from rest_framework import views
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Count, Q, Avg
from django.db.models.functions import TruncDate, TruncWeek
from datetime import timedelta, date
from django.utils import timezone
from .admin_permissions import require_permission
from .models import Vocabulary, UserProgress, Quiz
from .admin_models import UserActivityLog


class CohortAnalysisView(views.APIView):
    """Cohort retention analysis"""
    
    @require_permission('view_analytics')
    def get(self, request):
        # Get cohorts by signup week
        cohorts = []
        today = timezone.now().date()
        
        for weeks_ago in range(12):  # Last 12 weeks
            cohort_start = today - timedelta(weeks=weeks_ago+1)
            cohort_end = today - timedelta(weeks=weeks_ago)
            
            # Users who signed up in this week
            cohort_users = User.objects.filter(
                date_joined__date__gte=cohort_start,
                date_joined__date__lt=cohort_end
            )
            
            cohort_size = cohort_users.count()
            if cohort_size == 0:
                continue
            
            # Calculate retention for each week after signup
            retention = []
            for week in range(min(weeks_ago + 1, 12)):
                week_start = cohort_end + timedelta(weeks=week)
                week_end = week_start + timedelta(weeks=1)
                
                active_users = cohort_users.filter(
                    last_login__gte=week_start,
                    last_login__lt=week_end
                ).count()
                
                retention.append({
                    'week': week,
                    'active_users': active_users,
                    'retention_rate': round((active_users / cohort_size) * 100, 1)
                })
            
            cohorts.append({
                'cohort_week': cohort_start.strftime('%Y-W%W'),
                'cohort_size': cohort_size,
                'retention': retention
            })
        
        return Response({'cohorts': cohorts})


class EngagementMetricsView(views.APIView):
    """User engagement funnel and metrics"""
    
    @require_permission('view_analytics')
    def get(self, request):
        total_users = User.objects.count()
        
        # Engagement funnel
        users_with_vocab = User.objects.annotate(
            vocab_count=Count('vocabulary')
        ).filter(vocab_count__gt=0).count()
        
        users_with_quiz = User.objects.filter(quiz__isnull=False).distinct().count()
        
        # Active users
        today = timezone.now().date()
        dau = User.objects.filter(last_login__date=today).count()
        wau = User.objects.filter(last_login__gte=today - timedelta(days=7)).count()
        mau = User.objects.filter(last_login__gte=today - timedelta(days=30)).count()
        
        # Engagement levels
        highly_engaged = User.objects.annotate(
            vocab_count=Count('vocabulary')
        ).filter(vocab_count__gte=50).count()
        
        moderately_engaged = User.objects.annotate(
            vocab_count=Count('vocabulary')
        ).filter(vocab_count__gte=10, vocab_count__lt=50).count()
        
        return Response({
            'funnel': {
                'total_signups': total_users,
                'added_vocabulary': users_with_vocab,
                'took_quiz': users_with_quiz,
                'conversion_to_vocab': round((users_with_vocab / total_users * 100), 1) if total_users > 0 else 0,
                'conversion_to_quiz': round((users_with_quiz / total_users * 100), 1) if total_users > 0 else 0
            },
            'active_users': {
                'dau': dau,
                'wau': wau,
                'mau': mau,
                'dau_mau_ratio': round((dau / mau * 100), 1) if mau > 0 else 0
            },
            'engagement_levels': {
                'highly_engaged': highly_engaged,
                'moderately_engaged': moderately_engaged,
                'low_engaged': total_users - highly_engaged - moderately_engaged
            }
        })


class ChurnPredictionView(views.APIView):
    """Identify users at risk of churning"""
    
    @require_permission('view_analytics')
    def get(self, request):
        today = timezone.now().date()
        
        # Users who haven't logged in for 14+ days but were active before
        at_risk_users = User.objects.filter(
            Q(last_login__lt=today - timedelta(days=14)) |
            Q(last_login__isnull=True)
        ).filter(
            date_joined__lt=today - timedelta(days=7)  # Exclude very new users
        )
        
        at_risk_data = []
        for user in at_risk_users[:50]:  # Limit to 50
            vocab_count = Vocabulary.objects.filter(created_by=user).count()
            days_inactive = (today - user.last_login.date()).days if user.last_login else 999
            
            at_risk_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'days_inactive': days_inactive,
                'vocab_count': vocab_count,
                'risk_level': 'high' if days_inactive > 30 else 'medium'
            })
        
        return Response({
            'at_risk_count': at_risk_users.count(),
            'at_risk_users': at_risk_data
        })


class GrowthMetricsView(views.APIView):
    """Growth metrics and trends"""
    
    @require_permission('view_analytics')
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        today = timezone.now().date()
        
        # Daily signups
        signups_by_day = []
        for i in range(days):
            day = today - timedelta(days=days-i-1)
            count = User.objects.filter(date_joined__date=day).count()
            signups_by_day.append({
                'date': day.strftime('%Y-%m-%d'),
                'signups': count
            })
        
        # Cumulative users
        total_users = User.objects.count()
        
        # Growth rate
        week_ago_users = User.objects.filter(date_joined__lt=today - timedelta(days=7)).count()
        weekly_growth = total_users - week_ago_users
        growth_rate = round((weekly_growth / week_ago_users * 100), 1) if week_ago_users > 0 else 0
        
        return Response({
            'signups_by_day': signups_by_day,
            'total_users': total_users,
            'weekly_growth': weekly_growth,
            'growth_rate': growth_rate
        })
