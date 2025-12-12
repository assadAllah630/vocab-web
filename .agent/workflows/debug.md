---
description: Systematically debug issues in VocabMaster
---

## Step 1: Document the Bug
```
ISSUE: [Clear description]
EXPECTED: [What should happen]
ACTUAL: [What actually happens]
```

## Step 2: Check Error Sources
- **Browser Console** (F12 → Console)
- **Network Tab** (F12 → Network → XHR)
- **Backend Logs** (Terminal running Django)

## Step 3: Add Debug Logging

### Frontend
```javascript
console.log('🔍 Debug:', { variable, state });
```

### Backend
```python
import logging
logger = logging.getLogger(__name__)
logger.info(f"🔍 Debug: {variable}")
```

## Step 4: Isolate the Problem

### Is it Frontend or Backend?
```bash
curl -X GET http://localhost:8000/api/endpoint/ \
  -H "Authorization: Token <token>"
```

### Is it Authentication?
Check `request.user.is_authenticated`

### Is it AI Gateway?
Check `/api/ai-gateway/status/`

## Step 5: Fix and Verify
1. Make the fix
2. Reproduce original steps
3. Verify fix works
4. Check for regressions

## Common Issues
| Symptom | Check |
|---------|-------|
| 401 Unauthorized | Token, auth headers |
| 500 Server Error | Django logs |
| 429 Too Many Requests | AI Gateway fallback |
| White screen | Browser console |

## Hard Rules
- ❌ NEVER commit debug logging
- ⚠️ Always check both frontend AND backend
