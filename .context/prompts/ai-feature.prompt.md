# AI Feature Workflow

> Workflow for adding AI-powered features to VocabMaster.a

## Context to Load
```
@context: .context/modules/backend/ai_gateway.context.md
@context: .context/architecture.md
```

---

## Step 1: Choose AI Integration Type

| Type | Use Case | Function |
|------|----------|----------|
| Text Generation | Stories, articles, explanations | `generate_ai_content()` |
| Image Generation | Illustrations, vocabulary images | `generate_ai_image()` |
| Structured Output | JSON responses, quizzes | `generate_ai_content()` with prompt |

---

## Step 2: Use unified_ai

File: `server/api/unified_ai.py`

```python
from api.unified_ai import generate_ai_content, generate_ai_image

# Text generation
result = generate_ai_content(
    prompt="Generate a story about...",
    user=request.user,  # Required for logging
    context={
        "words": word_list,
        "level": "B1"
    }
)

if result['success']:
    content = result['content']
else:
    error = result['error']

# Image generation
image_result = generate_ai_image(
    prompt="A friendly cartoon cat learning vocabulary",
    user=request.user
)

if image_result['success']:
    image_base64 = image_result['image_base64']
```

---

## Step 3: Handle Failures Gracefully

```python
def generate_with_fallback(prompt, user):
    """Generate content with proper error handling."""
    try:
        result = generate_ai_content(prompt, user)
        
        if result['success']:
            return result['content']
        
        # AI Gateway failed - use fallback
        logger.warning(f"AI Gateway failed: {result.get('error')}")
        return generate_fallback_content()
        
    except Exception as e:
        logger.error(f"AI generation error: {e}")
        return generate_fallback_content()

def generate_fallback_content():
    """Return pre-written content when AI fails."""
    return "Content generation temporarily unavailable."
```

---

## Step 4: Add to View

```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_my_content(request):
    prompt = request.data.get('prompt', '')
    
    if not prompt:
        return Response(
            {'error': 'Prompt is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    result = generate_ai_content(prompt, request.user)
    
    if result['success']:
        return Response({
            'content': result['content'],
            'provider': result.get('provider', 'unknown')
        })
    else:
        return Response(
            {'error': result.get('error', 'Generation failed')},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
```

---

## Step 5: Frontend Integration

```javascript
const generateContent = async (prompt) => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await api.post('/generate-content/', { prompt });
    setContent(response.data.content);
  } catch (err) {
    if (err.response?.status === 503) {
      setError('AI service temporarily unavailable. Please try again.');
    } else {
      setError(err.response?.data?.error || 'Generation failed');
    }
  } finally {
    setLoading(false);
  }
};
```

---

## Step 6: Monitor in AI Gateway Dashboard

After implementation:
1. Go to AI Gateway Dashboard
2. Check usage logs
3. Verify provider selection
4. Monitor health scores

---

## Provider Fallback Chain

```
1. Gemini (primary, free tier)
   ↓ (if quota exceeded)
2. OpenRouter (fallback, paid)
   ↓ (if fails)
3. Static fallback content
```

---

## Hard Rules

- ❌ NEVER call AI providers directly (always use unified_ai)
- ❌ NEVER skip the `user` parameter (required for logging)
- ⚠️ Always handle AI failures gracefully
- ⚠️ Always show loading state during generation
- ⚠️ Consider rate limiting for expensive operations
