"""
Script to CLEAN and RESEED ModelDefinitions in the remote database.
This ensures that decommissioned models (like Llama 3 on Groq) are deactivated
and new models are added.
"""

import os
# Use the same connection string as unblock_models.py
os.environ['DATABASE_URL'] = "postgresql://vocabmaster:1RZ8xSDg5Acx599w1TRBdj2u74jMXjSv@dpg-d4jmdn0bdp1s73825mcg-a.oregon-postgres.render.com/vocabmaster"
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')

import django
django.setup()

from api.ai_gateway.models import ModelDefinition
from api.ai_gateway.services.model_selector import model_selector

print("=" * 60)
print("SEEDING & CLEANING MODEL DEFINITIONS")
print("=" * 60)

# Step 1: Deactivate ALL models first
# This ensures that any model NOT in our new list becomes inactive
print("\n📉 Deactivating ALL existing ModelDefinitions...")
count = ModelDefinition.objects.update(is_active=False)
print(f"   Marked {count} models as inactive.")

# Step 2: Seed the new lists (this will Reactivate valid ones and Create new ones)
print("\n🌱 Seeding valid providers...")
providers = ['gemini', 'groq', 'openrouter']

for provider in providers:
    print(f"   - Seeding {provider}...")
    model_selector._seed_provider_models(provider)

# Step 3: Report
print("\n✅ SEEDING COMPLETE!")
print("-" * 30)

active_models = ModelDefinition.objects.filter(is_active=True)
print(f"Total Active Models: {active_models.count()}")

for md in active_models.order_by('provider', 'model_id'):
    print(f"   [ACTIVE] {md.provider.ljust(12)} {md.model_id}")

print("-" * 30)
inactive_models = ModelDefinition.objects.filter(is_active=False)
if inactive_models.exists():
    print(f"Deactivated (Decommissioned) Models: {inactive_models.count()}")
    for md in inactive_models:
         print(f"   [INACTIVE] {md.provider.ljust(12)} {md.model_id}")

print("=" * 60)
