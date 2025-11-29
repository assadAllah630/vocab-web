import json
import time
from django.utils import timezone
from datetime import timedelta
from .admin_models import APIUsageLog

class APIUsageMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        # Cost per 1k tokens or per request (approximate)
        self.COST_RATES = {
            'gemini': 0.0005, # Per request (simplified)
            'stable_horde': 0.0, # Free
            'huggingface': 0.0, # Free tier
            'openrouter': 0.001, # Per request
        }

    def __call__(self, request):
        # Track ANY request that uses AI (detected by API key headers)
        has_gemini_key = request.headers.get('X-Gemini-Key')
        has_openrouter_key = request.headers.get('X-OpenRouter-Key')
        is_ai_endpoint = request.path.startswith('/api/ai/')
        is_semantic_search = request.path.startswith('/api/vocab/semantic-search/')
        is_grammar_gen = request.path.startswith('/api/grammar/generate/')
        
        # Debug logging
        if request.path.startswith('/api/vocab/') and request.method == 'POST':
            print(f"[MIDDLEWARE DEBUG] Vocab POST request:")
            print(f"  Path: {request.path}")
            print(f"  Has X-Gemini-Key: {bool(has_gemini_key)}")
            print(f"  Has X-OpenRouter-Key: {bool(has_openrouter_key)}")
            print(f"  All Headers: {dict(request.headers)}")
        
        has_ai_key = has_gemini_key or has_openrouter_key or is_ai_endpoint or is_semantic_search or is_grammar_gen
        
        if not has_ai_key:
            return self.get_response(request)

        # IMPORTANT: Read body BEFORE processing request, as it can only be read once
        req_data = {}
        try:
            if request.body:
                body_unicode = request.body.decode('utf-8')
                req_data = json.loads(body_unicode)
        except (json.JSONDecodeError, UnicodeDecodeError, Exception):
            # If body can't be parsed, just skip it
            pass

        start_time = time.time()
        response = self.get_response(request)
        duration = int((time.time() - start_time) * 1000)

        # Determine provider (improved logic)
        provider = 'unknown'
        if request.headers.get('X-Gemini-Key') or 'gemini' in request.path or 'chat' in request.path or 'grammar' in request.path:
            provider = 'gemini'
        elif request.headers.get('X-OpenRouter-Key') or 'semantic-search' in request.path:
            provider = 'openrouter'
        elif 'image' in request.path:
            provider = 'stable_horde'

        # Calculate cost
        cost = self.COST_RATES.get(provider, 0.0)

        # Log to DB
        if request.user.is_authenticated:
            try:
                # Determine success based on status code
                success = 200 <= response.status_code < 300

                APIUsageLog.objects.create(
                    user=request.user,
                    provider=provider,
                    endpoint=request.path,
                    request_data=req_data,
                    response_status=response.status_code,
                    response_time_ms=duration,
                    success=success,
                    estimated_cost=cost
                )
                print(f"[MIDDLEWARE] ✅ Logged: {request.path} - {provider} - Success: {success}")
            except Exception as e:
                print(f"Failed to log API usage: {e}")

        return response


class UpdateLastActivityMiddleware:
    """
    Middleware to update user's last_login timestamp on API activity.
    This ensures the admin panel shows accurate 'online' status.
    Updates are throttled to every 5 minutes to avoid excessive DB writes.
    """
    def __init__(self, get_response):
        self.get_response = get_response
        # Update frequency: 2 minutes (best practice balance)
        self.UPDATE_INTERVAL = timedelta(minutes=2)

    def __call__(self, request):
        # Process the request first
        response = self.get_response(request)
        
        # Only update for authenticated users on API endpoints
        if request.user.is_authenticated and request.path.startswith('/api/'):
            try:
                # Check if we need to update last_login
                now = timezone.now()
                should_update = False
                
                if request.user.last_login is None:
                    should_update = True
                    print(f"[UpdateLastActivity] User {request.user.username} has no last_login, updating...")
                else:
                    # Only update if it's been more than UPDATE_INTERVAL since last update
                    time_since_login = now - request.user.last_login
                    if time_since_login >= self.UPDATE_INTERVAL:
                        should_update = True
                        print(f"[UpdateLastActivity] User {request.user.username} last_login was {time_since_login.total_seconds():.0f}s ago, updating...")
                
                if should_update:
                    # Update last_login to reflect current activity
                    request.user.last_login = now
                    request.user.save(update_fields=['last_login'])
                    print(f"[UpdateLastActivity] Updated last_login for {request.user.username} at {now}")
                else:
                    time_since = (now - request.user.last_login).total_seconds() if request.user.last_login else 0
                    print(f"[UpdateLastActivity] Skipping update for {request.user.username} (last updated {time_since:.0f}s ago)")
            except Exception as e:
                # Fail silently to avoid breaking the request
                print(f"Failed to update last_login: {e}")
        
        return response
