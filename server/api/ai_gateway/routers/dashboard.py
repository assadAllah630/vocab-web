"""
Dashboard Router for AI Gateway - User-friendly usage summary.
"""

import logging
from datetime import date, datetime, timedelta
from django.db.models import Sum, Avg, Count, F
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ..models import UserAPIKey, UsageLog, ModelInstance, ModelDefinition, FailureLog
from ..providers import get_all_providers, get_provider_info

logger = logging.getLogger(__name__)


class DashboardView(APIView):
    """
    GET /api/ai-gateway/dashboard
    
    Returns a user-friendly summary of all API usage with clear metrics:
    - Total capacity across all keys
    - Used today vs remaining
    - Per-provider breakdown
    - When quotas reset
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        now = timezone.now()
        today = date.today()
        
        # Get all user's active keys
        keys = UserAPIKey.objects.filter(user=user, is_active=True)
        
        # Get all user's model instances (needed for blocking check)
        # Fix: Query instances here so they are available in the loop below
        instances = ModelInstance.objects.filter(api_key__in=keys).select_related('model', 'api_key')
        
        # Calculate totals
        total_daily_capacity = 0
        total_used_today = 0
        total_requests_month = 0
        
        # Traffic Light Stats
        max_rpm_load = 0
        max_rpm_value = 0
        max_rpm_limit = 15
        
        
        provider_summary = {}
        blocked_keys_data = [] # New list to store blocked key details
        
        for key in keys:
            provider = key.provider
            provider_info = get_provider_info(provider)
            
            # Check blocking status from Key directly (Key-Level Circuit Breaker)
            is_key_blocked = key.is_blocked
            key_block_reason = key.block_reason
            key_block_until = key.block_until if is_key_blocked else None
            
            # Populate blocked_keys list
            if is_key_blocked:
                blocked_keys_data.append({
                    'id': key.id,
                    'nickname': key.key_nickname or f"Key {key.id}",
                    'provider': key.provider,
                    'block_reason': key_block_reason,
                    'block_until': key_block_until.isoformat() if key_block_until else None
                })
            
            # Add to totals
            total_daily_capacity += key.daily_quota
            total_used_today += key.requests_today
            total_requests_month += key.requests_this_month
            
            # Provider breakdown
            if provider not in provider_summary:
                provider_summary[provider] = {
                    'name': provider_info.get('name', provider),
                    'keys_count': 0,
                    'daily_capacity': 0,
                    'used_today': 0,
                    'remaining_today': 0,
                    'avg_health': 0,
                    'health_scores': [],
                    'models': [m['name'] for m in provider_info.get('models', [])[:4]],
                    'reset_info': provider_info.get('reset_time', 'Daily'),
                    'blocked_keys': 0, 
                }
            
            ps = provider_summary[provider]
            ps['keys_count'] += 1
            if is_key_blocked:
                ps['blocked_keys'] += 1  # Simplified
            
            ps['daily_capacity'] += key.daily_quota
            ps['used_today'] += key.requests_today
            ps['health_scores'].append(key.health_score)
            
            # Calculate RPM Load for this key (Traffic Light)
            minute_limit = key.minute_quota or 15
            
            # Accurate RPM Check via UsageLog
            # Count requests in the last 60 seconds
            one_minute_ago = now - timedelta(minutes=1)
            current_rpm = UsageLog.objects.filter(
                key=key, 
                timestamp__gte=one_minute_ago
            ).count()
                
            rpm_percent = (current_rpm / minute_limit) * 100
            
            # Track max load for the dashboard summary
            if rpm_percent > max_rpm_load:
                max_rpm_load = rpm_percent
                max_rpm_value = current_rpm
                max_rpm_limit = minute_limit
        
        # Calculate remaining and health averages
        for ps in provider_summary.values():
            ps['remaining_today'] = ps['daily_capacity'] - ps['used_today']
            ps['usage_percent'] = round(ps['used_today'] / max(ps['daily_capacity'], 1) * 100, 1)
            if ps['health_scores']:
                ps['avg_health'] = round(sum(ps['health_scores']) / len(ps['health_scores']), 1)
            del ps['health_scores']
        
        # Calculate overall remaining
        total_remaining = total_daily_capacity - total_used_today
        usage_percent = round(total_used_today / max(total_daily_capacity, 1) * 100, 1)
        
        # Cache stats from logs
        week_ago = today - timedelta(days=7)
        recent_logs = UsageLog.objects.filter(user=user, timestamp__date__gte=week_ago)
        total_requests_week = recent_logs.count()
        cache_hits = recent_logs.filter(cached=True).count()
        cache_hit_rate = round(cache_hits / max(total_requests_week, 1) * 100, 1)
        
        # Reset times
        seconds_to_minute_reset = 60 - now.second
        next_day = now.replace(hour=0, minute=0, second=0) + timedelta(days=1)
        hours_to_daily_reset = round((next_day - now).total_seconds() / 3600, 1)
        
        # =======================================================================
        # V2.0 MODEL-CENTRIC STATS
        # =======================================================================
        
        # instances query was moved to top of method
        user_keys = keys 

        
        # Model health overview
        total_models = instances.count()
        healthy_models = instances.filter(is_blocked=False, health_score__gte=70).count()
        blocked_models = instances.filter(is_blocked=True).count()
        degraded_models = instances.filter(is_blocked=False, health_score__lt=70).count()
        
        # Average health score
        avg_health = instances.aggregate(avg=Avg('health_score'))['avg'] or 100
        
        # Get top 10 models by confidence for display
        top_models = []
        for inst in instances.filter(is_blocked=False, api_key__isnull=False).order_by('-confidence_score')[:10]:
            key_nickname = ''
            if inst.api_key:
                key_nickname = inst.api_key.key_nickname or f"Key {inst.api_key.id}"
            top_models.append({
                'model_id': inst.model.model_id,
                'provider': inst.model.provider,
                'display_name': inst.model.display_name,
                'health_score': inst.health_score,
                'confidence_score': round(inst.confidence_score, 3),
                'remaining_daily': inst.remaining_daily,
                'daily_quota': inst.daily_quota,
                'is_text': inst.model.is_text,
                'is_image': inst.model.is_image,
                'quality_tier': inst.model.quality_tier,
                'key_nickname': key_nickname,
                'key_id': inst.api_key.id if inst.api_key else None,
                'is_blocked': inst.is_blocked or (inst.api_key and inst.api_key.is_blocked),
                'block_reason': inst.api_key.block_reason if (inst.api_key and inst.api_key.is_blocked) else inst.block_reason,
                'block_until': inst.api_key.block_until.isoformat() if (inst.api_key and inst.api_key.is_blocked and inst.api_key.block_until) else (inst.block_until.isoformat() if inst.block_until else None),
            })
        
        # Get blocked models
        blocked_list = []
        for inst in instances.filter(is_blocked=True)[:10]:
            blocked_list.append({
                'model_id': inst.model.model_id,
                'provider': inst.model.provider,
                'block_reason': inst.block_reason,
                'block_until': inst.block_until.isoformat() if inst.block_until else None,
            })
        
        # Recent failures (last 24 hours)
        day_ago = now - timedelta(hours=24)
        recent_failures = FailureLog.objects.filter(
            model_instance__api_key__in=user_keys,
            timestamp__gte=day_ago
        ).select_related('model_instance', 'model_instance__model').order_by('-timestamp')[:10]
        
        failure_list = []
        for fail in recent_failures:
            failure_list.append({
                'model_id': fail.model_instance.model.model_id,
                'provider': fail.model_instance.model.provider,
                'error_type': fail.error_type,
                'error_message': fail.error_message[:100] if fail.error_message else '',
                'timestamp': fail.timestamp.isoformat(),
            })
        
        # Failure stats by type
        failure_stats = FailureLog.objects.filter(
            model_instance__api_key__in=user_keys,
            timestamp__gte=day_ago
        ).values('error_type').annotate(count=Count('id')).order_by('-count')
        
        return Response({
            'summary': {
                'total_daily_capacity': total_daily_capacity,
                'used_today': total_used_today,
                'remaining_today': total_remaining,
                'remaining_daily_capacity': total_remaining, # Fix: Frontend alias
                'usage_percent': usage_percent,
                'total_keys': keys.count(),
                'active_keys': keys.count() - len(blocked_keys_data), # Fix: Frontend expects this field
                'total_providers': len(provider_summary),
                'requests_this_week': total_requests_week,
                'requests_this_month': total_requests_month,
                'tokens_used_today': keys.aggregate(Sum('tokens_used_today'))['tokens_used_today__sum'] or 0,
                'tokens_used_month': keys.aggregate(Sum('tokens_used_month'))['tokens_used_month__sum'] or 0,
                'cache_hit_rate': cache_hit_rate,
                
                # Traffic Light Data
                'current_rpm_load': round(max_rpm_load, 1),
                'current_rpm': max_rpm_value,
                'rpm_limit': max_rpm_limit,
            },
            'quota_status': {
                'status': 'ok' if usage_percent < 80 else ('warning' if usage_percent < 95 else 'critical'),
                'message': self._get_status_message(usage_percent, total_remaining),
            },
            'reset_times': {
                'next_minute_reset_seconds': seconds_to_minute_reset,
                'next_daily_reset_hours': hours_to_daily_reset,
                'next_daily_reset': next_day.isoformat(),
            },
            'providers': list(provider_summary.values()),
            
            # V2.0 MODEL-CENTRIC DATA
            'models': {
                'total': total_models,
                'healthy': healthy_models,
                'blocked': blocked_models,
                'degraded': degraded_models,
                'avg_health': round(avg_health, 1),
                'top_models': top_models,
                'blocked_list': blocked_list,
            },
            'blocked_keys': blocked_keys_data, # NEW: Explicit list of blocked keys
            'failures': {
                'recent': failure_list,
                'by_type': list(failure_stats),
            },
        })
    
    def _get_status_message(self, usage_percent: float, remaining: int) -> str:
        if usage_percent < 50:
            return f"Plenty of capacity! {remaining:,} requests remaining today."
        elif usage_percent < 80:
            return f"Good usage. {remaining:,} requests remaining today."
        elif usage_percent < 95:
            return f"Getting busy! Only {remaining:,} requests remaining today."
        else:
            return f"Almost at limit! Only {remaining:,} requests remaining. Consider adding more keys."
