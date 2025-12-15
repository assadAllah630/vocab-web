# AI Gateway Module Context

## Purpose

Centralized AI orchestration hub providing:
- **Model-centric selection** (v2.0) - Find perfect model in one try
- **Learning engine** - Updates from every success/failure
- **Multi-provider support** for text and image generation
- **Real-time quota tracking** per model per key
- **Health scoring and automatic blocking**

---

## Architecture (v2.0)

### Request Flow
```
Request → ModelSelector.find_best_model() → Best Model → Adapter → LearningEngine.record_*() → Response
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `ModelDefinition` | Static model metadata (capabilities, quotas, costs) |
| `ModelInstance` | Per-key-per-model state (remaining quota, health) |
| `ModelSelector` | Scores models, returns best with 99%+ confidence |
| `LearningEngine` | Records outcomes, blocks failed models |

---

## Provider Support

**Text Generation (12 models):**
- Gemini (2.0-flash, 1.5-flash, 1.5-pro)
- Groq (llama-3.3-70b, llama-3.1-8b, mixtral)
- OpenRouter (llama-3.2, mistral-7b, gemini-exp)
- HuggingFace, Cohere, DeepInfra

**Image Generation (3 models):**
- Pollinations (FREE unlimited)
- Gemini Imagen
- HuggingFace SDXL

---

## Key Files

### Core
- [unified_ai.py](file:///e:/vocab_web/server/api/unified_ai.py) - Main entry point

### Models
- [models.py](file:///e:/vocab_web/server/api/ai_gateway/models.py) - ModelDefinition, ModelInstance, FailureLog

### Services
- [model_selector.py](file:///e:/vocab_web/server/api/ai_gateway/services/model_selector.py) - Selection algorithm
- [learning_engine.py](file:///e:/vocab_web/server/api/ai_gateway/services/learning_engine.py) - Failure learning

### Background
- [tasks.py](file:///e:/vocab_web/server/api/ai_gateway/background/tasks.py) - Celery tasks

---

## Scoring Algorithm

```python
score = (quota × 0.25) + (health × 0.25) + (recency × 0.20) + (success_rate × 0.15) - (failure_penalty × 0.15)
```

**Factors:**
- `quota_score`: Remaining daily/minute quota
- `health_score`: Overall model health (0-100)
- `recency_score`: Time since last failure
- `success_rate`: Historical success percentage
- `failure_penalty`: Consecutive failures × 0.2

---

## Error Handling

| Error Type | Action |
|------------|--------|
| QUOTA_EXCEEDED | **Hybrid Backoff**: Use `Retry-After` if available, else 2h→4h→8h→16h→24h |
| RATE_LIMITED | Block 60 seconds |
| INVALID_KEY | Deactivate key permanently |
| MODEL_NOT_FOUND | Block model permanently |
| SERVER_ERROR | Health -15, block if 3+ failures |
| TIMEOUT | Health -10, increase latency estimate |

### External Usage Handling
If an API key is used outside the app and quota is depleted:
1. System attempts to use it → Gets `429 Quota Exceeded`
2. Checks for `Retry-After` header from provider
3. If available → Uses exact retry time
4. If not available → Exponential backoff (2h, then 4h, 8h, 16h, 24h max)
5. Auto-retries after backoff expires

---

## Usage Example

```python
from api.unified_ai import generate_ai_content, generate_ai_image

# Text generation (uses ModelSelector automatically)
response = generate_ai_content(
    user=request.user,
    prompt="Write a German story about a cat"
)
print(response.text)

# Image generation
result = generate_ai_image(
    user=request.user,
    prompt="A colorful owl reading a book"
)
```

---

## Management Commands

```bash
# Seed all model definitions
python manage.py seed_models

# Run Celery worker + beat
celery -A vocab_server worker -B --loglevel=info
```

---

## Monitoring & Dashboard

### Admin Dashboard
- **URL**: `/monitoring/ai-gateway`
- **Features**:
  - Real-time model health visualization per provider
  - Intelligent selection confidence scores
  - Blocked model tracking with unblock times
  - Failure log analytics (recent errors, error types)
  - Daily usage tracking per key and model

### Mobile User Dashboard
- **URL**: `/m/ai-gateway`
- **Features**:
  - Simplified "System Health" view
  - Top 5 performing models for the user
  - Personal quota usage vs limits
  - Status of individual API keys

---

## Troubleshooting

### Daily Quota Reset
Quotas reset at **midnight UTC** via Celery Beat.
To manually reset:
```python
from api.ai_gateway.services.learning_engine import learning_engine
from api.ai_gateway.models import UserAPIKey

# Reset ModelInstance quotas
learning_engine.reset_daily_quotas()

# Reset UserAPIKey counters
UserAPIKey.objects.filter(is_active=True).update(requests_today=0, tokens_used_today=0)
```

### Common Issues
- **429 Quota Exceeded**: Automatically handled by ModelSelector. Model is blocked until midnight.
- **Provider Outage**: Health score drops, traffic shifts to other providers.
- **Redis Connection**: Required for Celery Beat tasks. Ensure Redis is running.

---


---

## Interaction with Legacy System

*   **Strict Gateway Enforcement**: The legacy fallback via `user.profile.gemini_api_key` has been **removed**. All AI generation must occur through the Gateway.
*   **Dual-Use**: When `generate_ai_content` is called, it exclusively attempts to use the AI Gateway. If no valid gateway keys are found or generation fails, it raises an exception.
*   **Gradual Migration**: The `UserProfile` model still retains specialized keys (Deepgram, OCR, Stable Horde) but generic LLM keys (Gemini, OpenRouter, HuggingFace) have been migrated to the Gateway.

*Version: 2.2 | Updated: 2025-12-14*
