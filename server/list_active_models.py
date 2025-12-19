import os
os.environ['DATABASE_URL']='postgresql://vocabmaster:1RZ8xSDg5Acx599w1TRBdj2u74jMXjSv@dpg-d4jmdn0bdp1s73825mcg-a.oregon-postgres.render.com/vocabmaster'
os.environ.setdefault('DJANGO_SETTINGS_MODULE','vocab_server.settings')
os.environ['DEBUG']='True'
import django
django.setup()

from api.ai_gateway.models import ModelDefinition

with open('active_models_report.txt', 'w') as f:
    f.write("="*60 + "\n")
    f.write("ACTIVE MODELS IN REMOTE DATABASE\n")
    f.write("="*60 + "\n")

    active = ModelDefinition.objects.filter(is_active=True).order_by('provider', '-quality_tier')
    f.write(f"Total: {active.count()}\n")
    f.write("-"*60 + "\n")

    for m in active:
        f.write(f"{m.provider:12} | {m.quality_tier:8} | {m.model_id}\n")

    f.write("="*60 + "\n")

print("Report written to active_models_report.txt")
