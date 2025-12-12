"""
Celery Tasks for AI Gateway v2.0

Handles periodic quota resets and maintenance for ModelInstance.

Setup:
    1. Add to INSTALLED_APPS
    2. Configure CELERY_BEAT_SCHEDULE in settings
    3. Run: celery -A vocab_server worker -B
"""

from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task(name='ai_gateway.reset_minute_quotas')
def reset_minute_quotas():
    """
    Reset minute-level quotas for all ModelInstances.
    Run every 60 seconds via Celery Beat.
    """
    from api.ai_gateway.services.learning_engine import learning_engine
    
    try:
        count = learning_engine.reset_minute_quotas()
        logger.debug(f"[Celery] Reset minute quotas for {count} instances")
        return {'status': 'success', 'instances_updated': count}
    except Exception as e:
        logger.error(f"[Celery] Error resetting minute quotas: {e}")
        return {'status': 'error', 'error': str(e)}


@shared_task(name='ai_gateway.reset_daily_quotas')
def reset_daily_quotas():
    """
    Reset daily quotas and recover health scores.
    Run at midnight via Celery Beat.
    """
    from datetime import date
    from api.ai_gateway.models import UserAPIKey
    from api.ai_gateway.services.learning_engine import learning_engine
    
    try:
        # Reset ModelInstance quotas
        count = learning_engine.reset_daily_quotas()
        logger.info(f"[Celery] Reset daily quotas for {count} ModelInstances")
        
        # Also reset UserAPIKey counters
        key_count = UserAPIKey.objects.filter(is_active=True).update(
            requests_today=0,
            tokens_used_today=0,
            error_count_last_hour=0
        )
        logger.info(f"[Celery] Reset daily quotas for {key_count} UserAPIKeys")
        
        # Reset monthly counters on first day of month
        if date.today().day == 1:
            UserAPIKey.objects.filter(is_active=True).update(
                requests_this_month=0,
                tokens_used_month=0
            )
            logger.info("[Celery] Monthly quotas reset")
        
        return {'status': 'success', 'instances_updated': count, 'keys_updated': key_count}
    except Exception as e:
        logger.error(f"[Celery] Error resetting daily quotas: {e}")
        return {'status': 'error', 'error': str(e)}


@shared_task(name='ai_gateway.refresh_blocked_instances')
def refresh_blocked_instances():
    """
    Unblock instances whose block period has expired.
    Run every 30 seconds via Celery Beat.
    """
    from api.ai_gateway.services.learning_engine import learning_engine
    
    try:
        count = learning_engine.refresh_blocked_instances()
        if count > 0:
            logger.info(f"[Celery] Unblocked {count} instances")
        return {'status': 'success', 'instances_unblocked': count}
    except Exception as e:
        logger.error(f"[Celery] Error refreshing blocked instances: {e}")
        return {'status': 'error', 'error': str(e)}


@shared_task(name='ai_gateway.cleanup_old_failure_logs')
def cleanup_old_failure_logs():
    """
    Remove FailureLogs older than 7 days.
    Run daily at 3 AM.
    """
    from datetime import timedelta
    from django.utils import timezone
    from api.ai_gateway.models import FailureLog
    
    try:
        cutoff = timezone.now() - timedelta(days=7)
        deleted, _ = FailureLog.objects.filter(timestamp__lt=cutoff).delete()
        logger.info(f"[Celery] Deleted {deleted} old failure logs")
        return {'status': 'success', 'logs_deleted': deleted}
    except Exception as e:
        logger.error(f"[Celery] Error cleaning up failure logs: {e}")
        return {'status': 'error', 'error': str(e)}


# =============================================================================
# CELERY BEAT SCHEDULE
# Add this to your Django settings.py:
# =============================================================================
"""
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'ai-gateway-refresh-blocked': {
        'task': 'ai_gateway.refresh_blocked_instances',
        'schedule': 30.0,  # Every 30 seconds
    },
    'ai-gateway-reset-minute-quotas': {
        'task': 'ai_gateway.reset_minute_quotas',
        'schedule': 60.0,  # Every 60 seconds
    },
    'ai-gateway-reset-daily-quotas': {
        'task': 'ai_gateway.reset_daily_quotas',
        'schedule': crontab(hour=0, minute=0),  # Midnight
    },
    'ai-gateway-cleanup-logs': {
        'task': 'ai_gateway.cleanup_old_failure_logs',
        'schedule': crontab(hour=3, minute=0),  # 3 AM
    },
}
"""
