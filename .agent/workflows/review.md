---
description: Code review checklist before merging
---

## Code Quality
- [ ] No console.log / print statements
- [ ] No commented-out code
- [ ] Descriptive variable names
- [ ] Small, focused functions

## Security
- [ ] No hardcoded secrets or API keys
- [ ] Input validation on all user inputs
- [ ] Authentication where needed

## Performance
- [ ] No N+1 query issues
- [ ] Large lists are paginated

## Testing
- [ ] New code has tests
- [ ] All tests pass locally
- [ ] Edge cases covered

## Frontend
- [ ] Works on mobile
- [ ] Works in dark mode
- [ ] Loading states shown
- [ ] Error states handled

## Backend
- [ ] API returns proper status codes
- [ ] Uses `unified_ai` for AI calls

## Quick Checks
```bash
# Debug statements
grep -r "console.log" client/src/
grep -r "print(" server/api/

# Run tests
python manage.py test
```

## Hard Rules
- ❌ No direct Gemini/OpenAI calls (use unified_ai)
- ❌ No models.py changes without migration
- ❌ No API keys in code
