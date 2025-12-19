"""
Unblock all ModelInstances and reset health scores.
"""

import os
os.environ['DATABASE_URL'] = "postgresql://vocabmaster:1RZ8xSDg5Acx599w1TRBdj2u74jMXjSv@dpg-d4jmdn0bdp1s73825mcg-a.oregon-postgres.render.com/vocabmaster"
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')

import django
django.setup()

from api.ai_gateway.models import ModelInstance
from django.utils import timezone

print("=" * 60)
print("UNBLOCKING ALL MODEL INSTANCES")
print("=" * 60)

# Check current state
blocked = ModelInstance.objects.filter(is_blocked=True)
print(f"\n🔒 Currently blocked instances: {blocked.count()}")

for mi in blocked[:10]:
    print(f"   - {mi.model.provider}/{mi.model.model_id} (blocked until: {mi.block_until})")

# UNBLOCK ALL
print("\n🔓 Unblocking all instances...")

# Re-activate all ModelDefinitions (fix for accidental deactivation)
from api.ai_gateway.models import ModelDefinition
md_count = ModelDefinition.objects.update(is_active=True)
print(f"✅ Re-activated {md_count} ModelDefinitions!")

count = ModelInstance.objects.update(
    is_blocked=False,
    block_until=None,
    consecutive_failures=0,
    health_score=100,  # Reset health to max
    remaining_daily=1000,  # Reset daily quota
    remaining_minute=30,  # Reset minute quota
)

print(f"✅ Unblocked and reset {count} ModelInstances!")

# Verify
blocked_after = ModelInstance.objects.filter(is_blocked=True).count()
print(f"\n🔒 Blocked instances after fix: {blocked_after}")
print("=" * 60)
