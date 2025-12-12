# Review Workflow

> Workflow for code review checklist before merging changes.

---

## Quick Checklist

### Code Quality
- [ ] No console.log / print statements left
- [ ] No commented-out code
- [ ] Variable names are descriptive
- [ ] Functions are small and focused
- [ ] No duplicate code

### Security
- [ ] No hardcoded secrets or API keys
- [ ] Input validation on all user inputs
- [ ] Authentication required where needed
- [ ] SQL injection prevention (use ORM)
- [ ] XSS prevention (escape outputs)

### Performance
- [ ] No N+1 query issues
- [ ] Large lists are paginated
- [ ] Heavy operations are async
- [ ] Images are optimized

### Testing
- [ ] New code has tests
- [ ] All tests pass locally
- [ ] Edge cases covered
- [ ] Error handling tested

### Frontend
- [ ] Works on mobile
- [ ] Works in dark mode
- [ ] Loading states shown
- [ ] Error states handled
- [ ] Accessible (keyboard, screen readers)

### Backend
- [ ] API returns proper status codes
- [ ] Errors return helpful messages
- [ ] Rate limiting on expensive endpoints
- [ ] Uses `unified_ai` for AI calls

---

## Review Commands

```bash
# Check for debug statements
grep -r "console.log" client/src/
grep -r "print(" server/api/

# Check for TODO/FIXME
grep -r "TODO\|FIXME" .

# Run tests
python manage.py test
npm run test
```

---

## Hard Rules to Verify

- ❌ No direct Gemini/OpenAI calls (use unified_ai)
- ❌ No models.py changes without migration
- ❌ No API keys in code
- ❌ No breaking changes to public API without versioning
