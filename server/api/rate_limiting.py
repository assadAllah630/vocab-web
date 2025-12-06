"""
Rate Limiting Utilities for VocabMaster API

This module provides rate limiting decorators and utilities to protect
sensitive endpoints from brute-force attacks and API abuse.
"""

from functools import wraps
from django.core.cache import cache
from django.http import JsonResponse
from rest_framework import status
import time
import hashlib


def get_client_ip(request):
    """Extract client IP from request, handling proxies."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
    return ip


def rate_limit(requests_limit=5, window_seconds=60, key_prefix='rl', block_duration=300):
    """
    Rate limiting decorator for DRF views.
    
    Args:
        requests_limit: Maximum requests allowed in the window
        window_seconds: Time window in seconds
        key_prefix: Prefix for cache key
        block_duration: How long to block after exceeding limit (seconds)
    
    Example:
        @rate_limit(requests_limit=5, window_seconds=60)
        @api_view(['POST'])
        def login(request):
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            # Get client identifier
            ip = get_client_ip(request)
            
            # Create cache key
            view_name = view_func.__name__
            cache_key = f"{key_prefix}:{view_name}:{ip}"
            block_key = f"{key_prefix}:blocked:{view_name}:{ip}"
            
            # Check if IP is blocked
            if cache.get(block_key):
                remaining_time = cache.ttl(block_key) if hasattr(cache, 'ttl') else block_duration
                return JsonResponse({
                    'error': 'Too many requests. Please try again later.',
                    'retry_after': remaining_time
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            # Get current request count
            request_data = cache.get(cache_key)
            
            if request_data is None:
                # First request in window
                request_data = {
                    'count': 1,
                    'start_time': time.time()
                }
                cache.set(cache_key, request_data, window_seconds)
            else:
                # Check if window has expired
                elapsed = time.time() - request_data['start_time']
                
                if elapsed >= window_seconds:
                    # Reset window
                    request_data = {
                        'count': 1,
                        'start_time': time.time()
                    }
                    cache.set(cache_key, request_data, window_seconds)
                else:
                    # Increment count
                    request_data['count'] += 1
                    
                    if request_data['count'] > requests_limit:
                        # Block the IP
                        cache.set(block_key, True, block_duration)
                        return JsonResponse({
                            'error': 'Too many requests. Please try again later.',
                            'retry_after': block_duration
                        }, status=status.HTTP_429_TOO_MANY_REQUESTS)
                    
                    # Update cache
                    remaining_time = window_seconds - int(elapsed)
                    cache.set(cache_key, request_data, remaining_time)
            
            # Process the request
            return view_func(request, *args, **kwargs)
        
        return wrapped_view
    return decorator


# Pre-configured decorators for common use cases
def rate_limit_auth(view_func):
    """Rate limit for authentication endpoints: 5 requests per minute, 5 min block."""
    return rate_limit(requests_limit=5, window_seconds=60, key_prefix='auth', block_duration=300)(view_func)


def rate_limit_signup(view_func):
    """Rate limit for signup: 3 requests per minute, 10 min block."""
    return rate_limit(requests_limit=3, window_seconds=60, key_prefix='signup', block_duration=600)(view_func)


def rate_limit_otp(view_func):
    """Rate limit for OTP requests: 3 requests per 5 minutes, 15 min block."""
    return rate_limit(requests_limit=3, window_seconds=300, key_prefix='otp', block_duration=900)(view_func)


def rate_limit_ai(view_func):
    """Rate limit for AI endpoints: 10 requests per minute."""
    return rate_limit(requests_limit=10, window_seconds=60, key_prefix='ai', block_duration=60)(view_func)


def rate_limit_api(view_func):
    """General API rate limit: 60 requests per minute."""
    return rate_limit(requests_limit=60, window_seconds=60, key_prefix='api', block_duration=60)(view_func)
