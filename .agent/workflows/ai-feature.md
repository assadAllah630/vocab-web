---
description: Add AI-powered features using unified_ai
---

## Context
Load: `.context/modules/backend/ai_gateway.context.md`

## Step 1: Choose AI Type
| Type | Function |
|------|----------|
| Text Generation | `generate_ai_content()` |
| Image Generation | `generate_ai_image()` |

## Step 2: Use unified_ai
```python
from api.unified_ai import generate_ai_content, generate_ai_image

# Text generation
result = generate_ai_content(
    prompt="Generate a story...",
    user=request.user  # Required!
)

if result['success']:
    content = result['content']
else:
    error = result['error']

# Image generation
image_result = generate_ai_image(
    prompt="A cartoon cat...",
    user=request.user
)
```

## Step 3: Handle Failures
```python
def generate_with_fallback(prompt, user):
    try:
        result = generate_ai_content(prompt, user)
        if result['success']:
            return result['content']
        return generate_fallback_content()
    except:
        return generate_fallback_content()
```

## Step 4: Add to View
```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_my_content(request):
    result = generate_ai_content(prompt, request.user)
    if result['success']:
        return Response({'content': result['content']})
    return Response({'error': result.get('error')}, status=503)
```

## Step 5: Frontend Integration
```javascript
try {
  const response = await api.post('/generate/', { prompt });
  setContent(response.data.content);
} catch (err) {
  setError('AI service unavailable');
}
```

## Provider Fallback Chain
1. Gemini (primary)
2. OpenRouter (fallback)
3. Static content (last resort)

## Hard Rules
- ❌ NEVER call AI providers directly (use unified_ai)
- ❌ NEVER skip the `user` parameter
- ⚠️ Always handle AI failures gracefully
