# Debug Workflow

> Workflow for systematically debugging issues in VocabMaster.

## Context to Load
```
@context: .context/modules/backend/<module>.context.md
@context: .context/modules/frontend/<area>.context.md  (if UI-related)
```

---

## Step 1: Reproduce the Issue

### Document the Bug
```
ISSUE: [Clear description]
EXPECTED: [What should happen]
ACTUAL: [What actually happens]
STEPS TO REPRODUCE:
1. ...
2. ...
3. ...
```

### Environment Check
- [ ] Frontend running? (`npm run dev`)
- [ ] Backend running? (`python manage.py runserver`)
- [ ] Database accessible?
- [ ] API keys configured?

---

## Step 2: Check Error Sources

### Browser Console (Frontend)
```
Press F12 → Console tab
Look for: Red errors, network failures
```

### Network Tab (API)
```
Press F12 → Network tab
Filter: XHR/Fetch
Check: Status codes, response bodies
```

### Backend Logs (Django)
```
Terminal running Django server
Look for: Tracebacks, 500 errors, warnings
```

---

## Step 3: Add Debug Logging

### Frontend (React)
```javascript
console.log('🔍 Debug:', { variable, state, props });

// In API calls
try {
  const response = await api.get('/endpoint/');
  console.log('✅ Response:', response.data);
} catch (error) {
  console.error('❌ Error:', error.response?.data || error.message);
}
```

### Backend (Django)
```python
import logging
logger = logging.getLogger(__name__)

logger.info(f"🔍 Debug: {variable}")
logger.error(f"❌ Error: {str(e)}")

# For AI issues
print(f"[AI Gateway] Provider: {provider}, Response: {response[:100]}")
```

---

## Step 4: Isolate the Problem

### Is it Frontend or Backend?
```bash
# Test API directly
curl -X GET http://localhost:8000/api/endpoint/ \
  -H "Authorization: Token <token>"
```

### Is it Authentication?
```python
# Check if user is authenticated
print(f"User: {request.user}, Authenticated: {request.user.is_authenticated}")
```

### Is it Data?
```python
# Check database state
from api.models import MyModel
print(MyModel.objects.filter(user=user).count())
```

### Is it AI Gateway?
```python
# Check AI Gateway status
from api.unified_ai import generate_ai_content
result = generate_ai_content("Test prompt", user)
print(f"AI Result: {result}")
```

---

## Step 5: Fix and Verify

1. Make the fix
2. Reproduce the original steps
3. Verify the fix works
4. Check for regressions (other features still work?)

---

## Common Issues

| Symptom | Likely Cause | Check |
|---------|--------------|-------|
| 401 Unauthorized | Auth token missing/invalid | Request headers, token storage |
| 500 Server Error | Backend exception | Django logs, traceback |
| 429 Too Many Requests | API quota exceeded | AI Gateway health, fallback |
| White screen | React crash | Browser console for errors |
| Data not updating | State not refreshing | useEffect dependencies |

---

## Hard Rules

- ❌ NEVER commit debug logging (remove after fixing)
- ❌ NEVER ignore error handling
- ⚠️ Always check both frontend AND backend
- ⚠️ Document the root cause and fix
