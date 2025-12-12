"""
Background Jobs for AI Gateway.
Includes health monitoring, quota reset, and analytics aggregation.
"""

import logging
from datetime import date, timedelta
from django.utils import timezone
from django.db.models import Sum, Avg, Count, F

from api.ai_gateway.models import UserAPIKey, UsageLog, DailyAnalytics
from api.ai_gateway.utils.encryption import decrypt_api_key
from api.ai_gateway.adapters import get_adapter

logger = logging.getLogger(__name__)


async def run_health_check():
    """
    Health Monitor Job - Run every 5 minutes.
    
    Tests each active key with a minimal request and updates health scores.
    Auto-disables keys after 3 consecutive failures.
    """
    logger.info("Starting AI Gateway health check...")
    
    keys = UserAPIKey.objects.filter(is_active=True)
    checked = 0
    failures = 0
    
    for key in keys:
        try:
            # Decrypt and get adapter
            decrypted = decrypt_api_key(key.api_key_encrypted)
            adapter = get_adapter(key.provider, decrypted)
            
            # Test the key
            import time
            start = time.time()
            is_valid = await adapter.validate_key()
            latency = int((time.time() - start) * 1000)
            
            # Update key stats
            key.last_health_check = timezone.now()
            
            if is_valid:
                key.consecutive_failures = 0
                # Boost health score on success
                key.health_score = min(100, key.health_score + 5)
                # Update latency (rolling average)
                key.avg_latency_ms = (key.avg_latency_ms * 3 + latency) // 4
                logger.debug(f"Key {key.id} ({key.provider}) healthy, latency: {latency}ms")
            else:
                key.consecutive_failures += 1
                key.health_score = max(0, key.health_score - 20)
                failures += 1
                
                # Auto-disable after 3 consecutive failures
                if key.consecutive_failures >= 3:
                    key.is_active = False
                    logger.warning(f"Key {key.id} ({key.provider}) auto-disabled after 3 failures")
            
            key.save()
            checked += 1
            
        except Exception as e:
            logger.warning(f"Health check failed for key {key.id}: {e}")
            key.consecutive_failures += 1
            key.health_score = max(0, key.health_score - 10)
            key.save()
            failures += 1
    
    logger.info(f"Health check complete: {checked} keys checked, {failures} failures")


def reset_daily_quotas():
    """
    Daily Quota Reset Job - Run at midnight UTC.
    
    Resets daily request counters and cleans up Redis quota keys.
    """
    logger.info("Starting daily quota reset...")
    
    yesterday = date.today() - timedelta(days=1)
    
    # Reset database counters
    updated = UserAPIKey.objects.filter(is_active=True).update(
        requests_today=0,
        tokens_used_today=0,
        error_count_last_hour=0
    )
    
    # Reset monthly counters on first day of month
    if date.today().day == 1:
        UserAPIKey.objects.filter(is_active=True).update(
            requests_this_month=0,
            tokens_used_month=0
        )
        logger.info("Monthly quotas reset")
    
    logger.info(f"Daily quota reset complete: {updated} keys reset")


def aggregate_analytics():
    """
    Analytics Aggregator Job - Run hourly.
    
    Aggregates usage logs into daily analytics for faster querying.
    """
    logger.info("Starting analytics aggregation...")
    
    today = date.today()
    
    # Get all usage logs from today that haven't been aggregated
    logs = UsageLog.objects.filter(
        timestamp__date=today
    ).values(
        'user_id', 'key_id', 'provider'
    ).annotate(
        requests_count=Count('id'),
        tokens_total=Sum(F('tokens_input') + F('tokens_output')),
        avg_latency=Avg('latency_ms'),
        error_count=Count('id', filter=~F('status')),
        cache_hits=Count('id', filter=F('cached'))
    )
    
    for log in logs:
        # Calculate success rate
        total = log['requests_count']
        errors = log['error_count'] or 0
        success_rate = ((total - errors) / total * 100) if total > 0 else 100
        
        # Update or create daily analytics
        DailyAnalytics.objects.update_or_create(
            date=today,
            key_id=log['key_id'],
            defaults={
                'user_id': log['user_id'],
                'provider': log['provider'],
                'requests_count': log['requests_count'],
                'tokens_total': log['tokens_total'] or 0,
                'avg_latency': log['avg_latency'] or 0,
                'success_rate': success_rate,
                'error_count': errors,
                'cache_hit_count': log['cache_hits'] or 0,
            }
        )
    
    logger.info(f"Analytics aggregation complete: {len(logs)} records processed")


def cleanup_old_logs():
    """
    Cleanup Job - Run daily.
    
    Removes old usage logs to prevent database bloat.
    Keeps last 30 days of logs.
    """
    logger.info("Starting old log cleanup...")
    
    cutoff = timezone.now() - timedelta(days=30)
    deleted, _ = UsageLog.objects.filter(timestamp__lt=cutoff).delete()
    
    logger.info(f"Cleanup complete: {deleted} old logs deleted")


# Job scheduler setup (using APScheduler if available)
def setup_scheduler():
    """
    Set up APScheduler for background jobs.
    Call this from Django's ready() method or management command.
    """
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from apscheduler.triggers.cron import CronTrigger
        from apscheduler.triggers.interval import IntervalTrigger
        
        scheduler = AsyncIOScheduler()
        
        # Health check every 5 minutes
        scheduler.add_job(
            run_health_check,
            IntervalTrigger(minutes=5),
            id='ai_gateway_health_check',
            replace_existing=True
        )
        
        # Daily quota reset at midnight UTC
        scheduler.add_job(
            reset_daily_quotas,
            CronTrigger(hour=0, minute=0, timezone='UTC'),
            id='ai_gateway_quota_reset',
            replace_existing=True
        )
        
        # Analytics aggregation every hour
        scheduler.add_job(
            aggregate_analytics,
            CronTrigger(minute=5),  # 5 minutes past every hour
            id='ai_gateway_analytics',
            replace_existing=True
        )
        
        # Cleanup old logs daily at 3 AM UTC
        scheduler.add_job(
            cleanup_old_logs,
            CronTrigger(hour=3, minute=0, timezone='UTC'),
            id='ai_gateway_cleanup',
            replace_existing=True
        )
        
        scheduler.start()
        logger.info("AI Gateway background scheduler started")
        
        return scheduler
        
    except ImportError:
        logger.warning("APScheduler not available. Background jobs disabled.")
        logger.warning("Install with: pip install APScheduler")
        return None
