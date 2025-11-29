from django.utils import timezone
from django.db.models import Count, Sum
from django.contrib.auth.models import User
from .models import Vocabulary, GeneratedContent, UserProgress
from .admin_models import SystemMetrics, APIUsageLog
from datetime import timedelta

class AnalyticsService:
    @staticmethod
    def aggregate_daily_metrics():
        """
        Calculates and saves metrics for the current day.
        Should be run via a cron job or Celery task at the end of the day.
        """
        today = timezone.now().date()
        
        # Calculate metrics
        total_users = User.objects.count()
        new_signups = User.objects.filter(date_joined__date=today).count()
        active_users = User.objects.filter(last_login__date=today).count()
        
        vocab_added = Vocabulary.objects.filter(created_at__date=today).count()
        content_generated = GeneratedContent.objects.filter(created_at__date=today).count()
        
        # API Usage
        api_logs = APIUsageLog.objects.filter(timestamp__date=today)
        api_calls_total = api_logs.count()
        api_calls_gemini = api_logs.filter(provider='gemini').count()
        
        # Save to SystemMetrics
        metrics, created = SystemMetrics.objects.update_or_create(
            date=today,
            defaults={
                'total_users': total_users,
                'new_signups': new_signups,
                'active_users_day': active_users,
                'vocabulary_added': vocab_added,
                'content_generated': content_generated,
                'api_calls_total': api_calls_total,
                'api_calls_gemini': api_calls_gemini,
            }
        )
        return metrics

    @staticmethod
    def get_executive_stats():
        """
        Returns real-time stats for the executive dashboard.
        """
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        total_users = User.objects.count()
        active_today = User.objects.filter(last_login__date=today).count()
        new_users_week = User.objects.filter(date_joined__gte=today - timedelta(days=7)).count()
        total_vocab = Vocabulary.objects.count()
        
        return {
            'total_users': total_users,
            'active_users_today': active_today,
            'new_users_week': new_users_week,
            'total_vocabulary': total_vocab,
        }

    @staticmethod
    def get_user_growth_data(days=30):
        """
        Returns historical user growth data for charts.
        """
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        metrics = SystemMetrics.objects.filter(date__range=[start_date, end_date]).order_by('date')
        
        dates = []
        total_users = []
        active_users = []
        
        for m in metrics:
            dates.append(m.date.strftime('%Y-%m-%d'))
            total_users.append(m.total_users)
            active_users.append(m.active_users_day)
            
        return {
            'dates': dates,
            'total_users': total_users,
            'active_users': active_users
        }
