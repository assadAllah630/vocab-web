import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from api.ai_gateway.models import UserAPIKey, UsageLog
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

def fix_usage_counts():
    print("Fixing usage counts from Logs...")
    
    keys = UserAPIKey.objects.all()
    today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    for key in keys:
        # Calculate true usage from logs
        today_logs = UsageLog.objects.filter(key=key, timestamp__gte=today_start).count()
        month_logs = UsageLog.objects.filter(key=key, timestamp__gte=month_start).count()
        
        # Only update if different
        updated = False
        if today_logs != key.requests_today:
            print(f"Key {key.id}: Today {key.requests_today} -> {today_logs}")
            key.requests_today = today_logs
            updated = True
            
        if month_logs != key.requests_this_month:
            print(f"Key {key.id}: Month {key.requests_this_month} -> {month_logs}")
            key.requests_this_month = month_logs
            updated = True
        
        if updated:
            print(f"Saving Key {key.id}...")
            key.save(update_fields=['requests_today', 'requests_this_month'])
        else:
            print(f"Key {key.id} is correct (Today: {today_logs})")

    print("Done!")

if __name__ == '__main__':
    fix_usage_counts()
