
import os
import sys
import django

sys.path.append('e:\\vocab_web\\server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.ai_gateway.services.model_selector import model_selector
from api.ai_gateway.models import ModelInstance
from django.db.models import Q
from django.utils import timezone

User = get_user_model()
username = 'assad.allah630'
user = User.objects.get(username=username)


with open('debug_output.txt', 'w') as f:
    f.write(f"Simulating selection for user: {user.username}\n")

    # Check why Gemini is missing
    f.write("\n--- GEMINI DIAGNOSIS ---\n")
    all_gemini = ModelInstance.objects.filter(api_key__user=user, model__provider='gemini')
    f.write(f"Total Gemini Instances: {all_gemini.count()}\n")

    for i in all_gemini:
        reasons = []
        if not i.api_key.is_active: reasons.append("Key Inactive")
        if not i.model.is_active: reasons.append("Model Inactive")
        if i.is_blocked and (not i.block_until or i.block_until > timezone.now()): reasons.append(f"BLOCKED (Until {i.block_until})")
        
        status = "OK" if not reasons else f"EXCLUDED: {', '.join(reasons)}"
        f.write(f"[{status}] {i.model.model_id} (KeyID: {i.api_key.id})\n")

    # 1. Get Eligible
    f.write("\n--- ELIGIBLE LIST ---\n")
    eligible = model_selector._get_eligible_instances(
        user=user,
        request_type='text',
        required_capabilities=[],
        quality_tier=None,
        exclude_providers=[],
        min_context_window=0
    )

    for instance in eligible:
        score = model_selector.calculate_availability_score(instance)
        f.write(f"Model: {instance.model.model_id} ({instance.model.provider}) Score: {score:.4f}\n")

    f.write("\nRunning actual find_best_model:\n")
    result = model_selector.find_best_model(user, request_type='text')
    if result.model:
        f.write(f"WINNER: {result.model.model_id} with confidence {result.confidence}\n")
    else:
        f.write("NO WINNER\n")

