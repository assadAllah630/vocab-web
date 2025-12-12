"""
Stats Router for AI Gateway - Enhanced with model tracking.
"""

import logging
from datetime import date, datetime, timedelta
from django.db.models import Sum, Avg, Count, F
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ..models import UserAPIKey, UsageLog, DailyAnalytics
from ..providers import get_all_providers, get_provider_info, get_available_models

logger = logging.getLogger(__name__)


class StatsView(APIView):
    """GET /api/ai-gateway/stats - User's AI gateway statistics."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        today = date.today()
        week_ago = today - timedelta(days=7)
        now = timezone.now()
        
        # Key stats
        keys = UserAPIKey.objects.filter(user=user)
        total_keys = keys.count()
        active_keys = keys.filter(is_active=True).count()
        
        # Provider breakdown with quota info
        providers = {}
        for key in keys:
            prov = key.provider
            if prov not in providers:
                provider_info = get_provider_info(prov)
                limits = provider_info.get('limits', {})
                providers[prov] = {
                    'provider': prov,
                    'name': provider_info.get('name', prov),
                    'total_keys': 0,
                    'active_keys': 0,
                    'requests_today': 0,
                    'minute_quota': limits.get('minute', 0),
                    'daily_quota': limits.get('daily', 0),
                    'reset_info': provider_info.get('reset_time', 'Unknown'),
                    'models_available': len(provider_info.get('models', [])),
                    'avg_health_score': 0,
                    'health_scores': [],
                }
            
            providers[prov]['total_keys'] += 1
            if key.is_active:
                providers[prov]['active_keys'] += 1
            providers[prov]['requests_today'] += key.requests_today
            providers[prov]['health_scores'].append(key.health_score)
        
        # Calculate averages
        for prov in providers.values():
            if prov['health_scores']:
                prov['avg_health_score'] = sum(prov['health_scores']) / len(prov['health_scores'])
            del prov['health_scores']
            # Calculate when quota resets
            prov['quota_usage_percent'] = round(prov['requests_today'] / max(prov['daily_quota'], 1) * 100, 1)
        
        # Usage logs
        recent_logs = UsageLog.objects.filter(user=user, timestamp__date__gte=week_ago)
        total_requests_week = recent_logs.count()
        
        # Model usage breakdown
        model_usage = recent_logs.values('model', 'provider').annotate(
            requests=Count('id'),
            avg_latency=Avg('latency_ms')
        ).order_by('-requests')[:10]
        
        # Today stats
        today_logs = recent_logs.filter(timestamp__date=today)
        requests_today = today_logs.count()
        
        # Cache hit rate
        cache_hits = recent_logs.filter(cached=True).count()
        cache_hit_rate = (cache_hits / total_requests_week * 100) if total_requests_week > 0 else 0
        
        return Response({
            'summary': {
                'total_keys': total_keys,
                'active_keys': active_keys,
                'requests_today': requests_today,
                'requests_week': total_requests_week,
                'cache_hit_rate': round(cache_hit_rate, 1),
            },
            'providers': list(providers.values()),
            'model_usage': list(model_usage),
            'quota_reset_info': {
                'next_minute_reset': (now + timedelta(seconds=60 - now.second)).isoformat(),
                'next_daily_reset': (now.replace(hour=0, minute=0, second=0) + timedelta(days=1)).isoformat(),
            }
        })


class ProvidersView(APIView):
    """GET /api/ai-gateway/providers - List all providers with their models."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        all_providers = get_all_providers()
        
        result = []
        for provider_id, info in all_providers.items():
            # Count user's keys for this provider
            key_count = UserAPIKey.objects.filter(
                user=request.user, 
                provider=provider_id, 
                is_active=True
            ).count()
            
            result.append({
                'id': provider_id,
                'name': info['name'],
                'default_model': info['default_model'],
                'models': info['models'],
                'limits': info['limits'],
                'reset_time': info['reset_time'],
                'user_keys': key_count,
            })
        
        return Response({'providers': result})


class ProviderStatsView(APIView):
    """GET /api/ai-gateway/stats/provider/{provider} - Detailed provider stats."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, provider):
        user = request.user
        today = date.today()
        week_ago = today - timedelta(days=7)
        now = timezone.now()
        
        provider_info = get_provider_info(provider)
        if not provider_info:
            return Response({'error': f'Unknown provider: {provider}'}, status=404)
        
        # Get keys for this provider
        keys = UserAPIKey.objects.filter(user=user, provider=provider)
        
        key_stats = []
        total_requests_today = 0
        for key in keys:
            key_logs = UsageLog.objects.filter(key=key, timestamp__date__gte=week_ago)
            
            # Model breakdown for this key
            model_breakdown = key_logs.values('model').annotate(
                requests=Count('id'),
                avg_latency=Avg('latency_ms')
            ).order_by('-requests')
            
            total_requests_today += key.requests_today
            
            # Calculate quota remaining and reset time
            limits = provider_info.get('limits', {})
            minute_remaining = max(0, limits.get('minute', 0) - key.requests_last_minute)
            daily_remaining = max(0, limits.get('daily', 0) - key.requests_today)
            
            key_stats.append({
                'id': key.id,
                'nickname': key.key_nickname or f"Key {key.id}",
                'is_active': key.is_active,
                'health_score': key.health_score,
                'avg_latency_ms': key.avg_latency_ms,
                'requests_today': key.requests_today,
                'requests_week': key_logs.count(),
                'minute_remaining': minute_remaining,
                'daily_remaining': daily_remaining,
                'minute_quota': limits.get('minute', 0),
                'daily_quota': limits.get('daily', 0),
                'quota_reset': {
                    'minute': (now + timedelta(seconds=60 - now.second)).isoformat(),
                    'daily': (now.replace(hour=0, minute=0, second=0) + timedelta(days=1)).isoformat(),
                },
                'model_usage': list(model_breakdown),
                'last_used': key.last_used_at.isoformat() if key.last_used_at else None,
            })
        
        return Response({
            'provider': provider,
            'name': provider_info['name'],
            'available_models': provider_info['models'],
            'limits': provider_info['limits'],
            'reset_info': provider_info['reset_time'],
            'total_keys': len(key_stats),
            'active_keys': sum(1 for k in key_stats if k['is_active']),
            'total_requests_today': total_requests_today,
            'keys': key_stats,
        })
