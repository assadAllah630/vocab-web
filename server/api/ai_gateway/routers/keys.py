"""
API Keys Router for AI Gateway.
Handles CRUD operations for user API keys.
"""

import asyncio
import logging
import time
from datetime import timezone as tz
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from ..models import UserAPIKey
from ..utils.encryption import encrypt_api_key, decrypt_api_key, mask_api_key
from ..adapters import get_adapter

logger = logging.getLogger(__name__)


def run_async(coro):
    """Run async coroutine from sync context."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, coro)
                return future.result()
        return loop.run_until_complete(coro)
    except RuntimeError:
        return asyncio.run(coro)


class KeysListCreateView(APIView):
    """
    GET: List all user's API keys (with stats, but masked)
    POST: Add a new API key (validates before storing)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """List user's API keys with their stats."""
        keys = UserAPIKey.objects.filter(user=request.user)
        
        data = []
        for key in keys:
            data.append({
                'id': key.id,
                'provider': key.provider,
                'nickname': key.key_nickname or f"Key {key.id}",
                'daily_quota': key.daily_quota,
                'minute_quota': key.minute_quota,
                'requests_today': key.requests_today,
                'requests_this_month': key.requests_this_month,
                'avg_latency_ms': key.avg_latency_ms,
                'error_count_last_hour': key.error_count_last_hour,
                'health_score': key.health_score,
                'is_active': key.is_active,
                'last_used_at': key.last_used_at.isoformat() if key.last_used_at else None,
                'created_at': key.created_at.isoformat(),
                # Circuit Breaker Status
                'is_blocked': key.is_blocked,
                'block_until': key.block_until.isoformat() if key.block_until else None,
                'block_reason': key.block_reason,
                'model_usage': [
                    {
                        'model': mu.model,
                        'requests_today': mu.requests_today,
                        'daily_quota': mu.daily_quota,
                        'percentage': min(100, int((mu.requests_today / mu.daily_quota) * 100)) if mu.daily_quota > 0 else 0
                    }
                    for mu in key.model_usages.all()
                ]
            })
        
        return Response({
            'keys': data,
            'total': len(data)
        })
    
    def post(self, request):
        """Add a new API key after validation."""
        provider = request.data.get('provider')
        api_key = request.data.get('api_key')
        nickname = request.data.get('nickname', '')
        daily_quota = request.data.get('daily_quota')
        minute_quota = request.data.get('minute_quota')
        skip_validation = request.data.get('skip_validation', False)
        
        # Validate required fields
        if not provider or not api_key:
            return Response(
                {'error': 'provider and api_key are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate provider
        valid_providers = ['gemini', 'groq', 'huggingface', 'openrouter', 'cohere', 'deepinfra']
        if provider not in valid_providers:
            return Response(
                {'error': f'Invalid provider. Must be one of: {", ".join(valid_providers)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate the key with a test request (unless skipped)
        if not skip_validation:
            try:
                adapter = get_adapter(provider, api_key)
                is_valid, error_msg = run_async(adapter.validate_key())
                
                if not is_valid:
                    logger.warning(f"Key validation failed for {provider}. Msg: {error_msg}")
                    return Response(
                        {'error': f'Validation failed: {error_msg}. Use "Force Add" to skip check.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Exception as e:
                logger.warning(f"Key validation error for {provider}: {e}")
                return Response(
                    {'error': f'Key validation failed: {str(e)}. Try adding with skip_validation=true.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Encrypt and store
        encrypted_key = encrypt_api_key(api_key)
        
        # Get default limits if not provided
        defaults = UserAPIKey.PROVIDER_LIMITS.get(provider, {'minute': 10, 'daily': 1000})
        
        key_obj = UserAPIKey.objects.create(
            user=request.user,
            provider=provider,
            api_key_encrypted=encrypted_key,
            key_nickname=nickname,
            daily_quota=daily_quota or defaults['daily'],
            minute_quota=minute_quota or defaults['minute'],
            health_score=100,
        )
        
        return Response({
            'id': key_obj.id,
            'provider': key_obj.provider,
            'nickname': key_obj.key_nickname,
            'message': 'API key added successfully',
            'masked_key': mask_api_key(api_key),
        }, status=status.HTTP_201_CREATED)


class KeyDetailView(APIView):
    """
    GET: Get single key details
    PATCH: Update key (nickname, quotas, active status)
    DELETE: Soft delete (set is_active=false)
    """
    permission_classes = [IsAuthenticated]
    
    def _get_key(self, request, key_id):
        """Get key or return None."""
        try:
            return UserAPIKey.objects.get(id=key_id, user=request.user)
        except UserAPIKey.DoesNotExist:
            return None
    
    def get(self, request, key_id):
        """Get details for a single key."""
        key = self._get_key(request, key_id)
        if not key:
            return Response(
                {'error': 'Key not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get the masked key for display
        try:
            decrypted = decrypt_api_key(key.api_key_encrypted)
            masked = mask_api_key(decrypted)
        except Exception:
            masked = "****"
        
        return Response({
            'id': key.id,
            'provider': key.provider,
            'nickname': key.key_nickname,
            'masked_key': masked,
            'daily_quota': key.daily_quota,
            'minute_quota': key.minute_quota,
            'requests_today': key.requests_today,
            'requests_this_month': key.requests_this_month,
            'avg_latency_ms': key.avg_latency_ms,
            'error_count_last_hour': key.error_count_last_hour,
            'health_score': key.health_score,
            'is_active': key.is_active,
            'consecutive_failures': key.consecutive_failures,
            'last_used_at': key.last_used_at.isoformat() if key.last_used_at else None,
            'last_health_check': key.last_health_check.isoformat() if key.last_health_check else None,
            'created_at': key.created_at.isoformat(),
            'updated_at': key.updated_at.isoformat(),
            'is_blocked': key.is_blocked,
            'block_until': key.block_until.isoformat() if key.block_until else None,
            'block_reason': key.block_reason,
            'model_usage': [
                {
                    'model': mu.model,
                    'requests_today': mu.requests_today,
                    'daily_quota': mu.daily_quota,
                    'percentage': min(100, int((mu.requests_today / mu.daily_quota) * 100)) if mu.daily_quota > 0 else 0
                }
                for mu in key.model_usages.all()
            ]
        })
    
    def patch(self, request, key_id):
        """Update key settings."""
        key = self._get_key(request, key_id)
        if not key:
            return Response(
                {'error': 'Key not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update allowed fields
        if 'nickname' in request.data:
            key.key_nickname = request.data['nickname']
        if 'daily_quota' in request.data:
            key.daily_quota = int(request.data['daily_quota'])
        if 'minute_quota' in request.data:
            key.minute_quota = int(request.data['minute_quota'])
        if 'is_active' in request.data:
            key.is_active = bool(request.data['is_active'])
        
        key.save()
        
        return Response({
            'id': key.id,
            'message': 'Key updated successfully'
        })
    
    def delete(self, request, key_id):
        """Soft delete a key (set is_active=false)."""
        key = self._get_key(request, key_id)
        if not key:
            return Response(
                {'error': 'Key not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Soft delete
        key.is_active = False
        key.save()
        
        return Response({
            'message': 'Key deactivated successfully'
        })


class KeyTestView(APIView):
    """Test an existing key with a ping request."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, key_id):
        """Test a key and update its health."""
        try:
            key = UserAPIKey.objects.get(id=key_id, user=request.user)
        except UserAPIKey.DoesNotExist:
            return Response(
                {'error': 'Key not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Decrypt and test
        try:
            decrypted = decrypt_api_key(key.api_key_encrypted)
            adapter = get_adapter(key.provider, decrypted)
            
            start = time.time()
            is_valid, error_msg = run_async(adapter.validate_key())
            latency = int((time.time() - start) * 1000)
            
            # Update key stats
            key.last_health_check = timezone.now()
            
            if is_valid:
                key.consecutive_failures = 0
                key.health_score = min(100, key.health_score + 10)
                key.avg_latency_ms = (key.avg_latency_ms + latency) // 2
                
                # Unblock key if it was blocked (Manual Override)
                if key.is_blocked:
                    key.is_blocked = False
                    key.block_reason = ''
                    key.block_until = None
                    logger.info(f"Key {key.id} unblocked via manual test")
                
                key.save()
                
                return Response({
                    'success': True,
                    'latency_ms': latency,
                    'health_score': key.health_score
                })
            else:
                key.consecutive_failures += 1
                key.health_score = max(0, key.health_score - 20)
                key.save()
                
                return Response({
                    'success': False,
                    'error': f'Validation failed: {error_msg}',
                    'health_score': key.health_score
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.exception(f"Key test error: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
