# Bugfix Workflow

## Context Loading

Load these files before starting:
1. **Backend bugs**: `.context/modules/backend/<module>.context.md`
2. **Frontend bugs**: `.context/modules/frontend/<area>.context.md`
3. **Mobile bugs**: `.context/modules/mobile/<area>.context.md`
4. **Admin bugs**: `.context/modules/admin/<area>.context.md`
5. `.context/architecture.md` (if systemic bug)

---

## Bugfix Steps

### 1. Reproduce the Bug

```python
# Write a failing test FIRST
def test_bug_reproduction():
    """This test should fail until bug is fixed."""
    # Setup
    # Action
    # Assert expected behavior (currently failing)
```

### 2. Locate Root Cause

- Check error logs
- Trace the code path
- Identify the failure point

### 3. Create Fix Branch

```bash
git checkout -b fix/<module>-<bug-description>
```

### 4. Apply Fix

- Fix the identified issue
- Keep changes minimal
- Don't refactor during bugfix

### 5. Verify Fix

- Run the failing test (should pass now)
- Run all related tests
- Manually verify if UI bug

### 6. Check Architecture Consistency

- Does fix maintain domain boundaries?
- Any side effects on other modules?

### 7. Update Context if Behavior Changed

If the fix changes documented behavior:
- Update module context
- Document the fix decision

---

## Commit Format

```
fix(<module>): short description

- Fixed <issue>
- Added test for regression
```

---

## Post-Fix Checklist

- [ ] Failing test exists and now passes
- [ ] All related tests pass
- [ ] No side effects on other tests
- [ ] Architecture consistency maintained
- [ ] Module context updated (if behavior changed)
- [ ] PR created with clear description

---

## Hard Rules

- ❌ No fix without a test proving the bug
- ❌ No large refactors in bugfix PRs
- ❌ Don't break existing functionality
