from api.admin_models import APIUsageLog

# Check total count
total = APIUsageLog.objects.count()
print(f"Total API Usage Logs: {total}")

# Show recent logs
print("\nRecent API Logs:")
for log in APIUsageLog.objects.order_by('-timestamp')[:10]:
    print(f"  {log.timestamp} | {log.endpoint} | {log.provider} | Success: {log.success}")
