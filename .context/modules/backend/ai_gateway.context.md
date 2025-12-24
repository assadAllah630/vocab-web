# AI Gateway Context

## Purpose
The **AI Gateway** is the centralized hub for all AI operations. It abstracts vendor-specific APIs, manages API keys, handles failover, and enforces rate limits.

## Architecture
The system uses a "Unified AI" capability-based routing approach.

`App` -> `unified_ai.generate_ai_content` -> `ModelSelector` -> `Adapter` -> `Vendor API`

### Key Components
1. **unified_ai.py**: The public interface. Used by all views/agents.
2. **ModelSelector**: Smart routing logic. Selects best model based on:
   - User's API keys (available providers).
   - `required_capabilities` (e.g., `json_mode`).
   - `quality_tier` (Low/Medium/High).
   - Provider health scores.
3. **Adapters**: Vendor-specific implementations in `server/api/ai_gateway/adapters/`.
4. **LearningEngine**: Feedback loop that updates provider health scores based on success/failure.

## Supported Providers

### Text Generation
- **Gemini**: `gemini-2.0-flash` (Primary, free tier).
- **OpenRouter**: Aggregator (Mistral, Llama, etc.).
- **Groq**: Llama 3 (Fast inference).
- **HuggingFace**: Inference API.
- **Cohere**: Command models.
- **DeepInfra**: Open source models.

### Image Generation
- **Pollinations.AI**: Free, unlimited (Primary).
- **Gemini**: Imagen 3.
- **HuggingFace**: Stable Diffusion.

## Usage Guide

### Standard Generation
```python
from api.unified_ai import generate_ai_content

# Simple text generation
response = generate_ai_content(
    user=request.user, 
    prompt="Explain quantum physics", 
    max_tokens=500
)
print(response.text)
```

### Structured Output (JSON)
```python
# Force JSON mode for structured data extraction
response = generate_ai_content(
    user=request.user, 
    prompt="List 3 french verbs in JSON format", 
    json_mode=True
)
# Returns valid JSON string
```

### Image Generation
```python
from api.unified_ai import generate_ai_image

# Generate 1024x1024 image
result = generate_ai_image(
    user=request.user,
    prompt="A futuristic city in cyberpunk style",
    size="1024x1024"
)
# result['image_base64'] or result['url']
```

## Database Models
- `UserAPIKey`: Stores encrypted vendor keys.
- `UsageLog`: Tracks every AI call (latency, tokens, status).
- `ModelDefinition`: Metadata about capabilities of known models.
