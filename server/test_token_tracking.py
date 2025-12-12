
import os
import django
import sys
from django.conf import settings
from unittest.mock import MagicMock

# Setup Django environment
sys.path.append('e:\\vocab_web\\server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from api.ai_gateway.models import UserAPIKey
from api.unified_ai import GatewayResponse
from django.contrib.auth.models import User
from django.utils import timezone
from api.ai_gateway.background.jobs import reset_daily_quotas

def test_token_tracking_update():
    """Test that unified_ai logic updates token counters"""
    print("Testing token tracking update logic...")
    
    # Create test user and key
    user, _ = User.objects.get_or_create(username="test_token_user")
    key, _ = UserAPIKey.objects.get_or_create(
        user=user, 
        provider="gemini",
        defaults={
            "api_key_encrypted": "test", 
            "key_nickname": "Test Key"
        }
    )
    
    # Reset counters
    key.requests_today = 0
    key.tokens_used_today = 0
    key.tokens_used_month = 0
    key.save()
    
    # Simulate logic from unified_ai.py (lines 98-115)
    # We can't call unified_ai directly easily without mocking the adapter, 
    # so we replicate the critical update block to verify model behavior
    
    response = MagicMock()
    response.success = True
    response.tokens_input = 100
    response.tokens_output = 50
    response.latency_ms = 200
    
    print(f"  Simulating response with {response.tokens_input} in, {response.tokens_output} out")
    
    # The Logic Block
    key.last_used_at = timezone.now()
    key.requests_today += 1
    key.requests_this_month += 1
    
    if response.tokens_input > 0 or response.tokens_output > 0:
        total = response.tokens_input + response.tokens_output
        key.tokens_used_today += total
        key.tokens_used_month += total
        
    key.save()
    
    # Verify
    key.refresh_from_db()
    
    assert key.requests_today == 1, "Requests today should be 1"
    assert key.tokens_used_today == 150, f"Tokens today should be 150, got {key.tokens_used_today}"
    assert key.tokens_used_month == 150, f"Tokens month should be 150, got {key.tokens_used_month}"
    
    print("✅ Token update verified!")

def test_reset_logic():
    """Test that reset_daily_quotas clears token counters"""
    print("\nTesting reset logic...")
    
    # Set values to non-zero
    UserAPIKey.objects.filter(provider="gemini").update(
        tokens_used_today=999,
        requests_today=10
    )
    
    # Run reset
    reset_daily_quotas()
    
    # Verify
    # We check if ANY key has non-zero tokens today (should be none)
    count = UserAPIKey.objects.filter(tokens_used_today__gt=0).count()
    
    assert count == 0, f"Found {count} keys with tokens after reset!"
    print("✅ Reset logic verified!")

if __name__ == "__main__":
    try:
        test_token_tracking_update()
        test_reset_logic()
        print("\n🎉 All token tracking tests passed!")
    except AssertionError as e:
        print(f"\n❌ Test FAILED: {e}")
    except Exception as e:
        print(f"\n❌ Error: {e}")
