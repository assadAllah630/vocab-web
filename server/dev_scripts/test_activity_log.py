import os
import django
import sys
from datetime import timedelta

# Setup Django environment
sys.path.append('e:\\vocab_web\\server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIRequestFactory
from api.views import user_statistics

def test_activity_log():
    print("Testing Activity Log in User Statistics...")
    user = User.objects.first()
    if not user:
        print("No user found!")
        return

    factory = APIRequestFactory()
    request = factory.get('/api/stats/')
    request.user = user
    
    response = user_statistics(request)
    
    print(f"Status Code: {response.status_code}")
    
    if 'activity_log' in response.data:
        log = response.data['activity_log']
        print(f"Activity Log found with {len(log)} entries.")
        
        # Check if today's date exists (since we likely ran tests/simulations today)
        today_str = timezone.now().strftime('%Y-%m-%d')
        if today_str in log:
            print(f"  [OK] Found activity for today ({today_str}): {log[today_str]} activities")
        else:
            print(f"  [INFO] No activity found for today ({today_str}) yet.")
            
        # Print sample entries
        print("Sample entries:")
        for date, count in list(log.items())[:5]:
            print(f"  {date}: {count}")
            
        print("\n[OK] Activity Log Test Passed!")
    else:
        print("\n[FAIL] 'activity_log' missing from response!")

if __name__ == "__main__":
    test_activity_log()
