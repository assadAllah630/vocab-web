---
description: Refactor code without changing behavior
---

## Step 1: Identify Target
What to refactor and why:
- Large file → Split into modules
- Duplicate code → Extract common function
- Complex function → Break into smaller pieces

## Step 2: Ensure Tests Exist
Run existing tests:
```bash
python manage.py test
```
If no tests, write them first!

## Step 3: Refactor in Small Steps
1. Make one small change
2. Run tests
3. Commit
4. Repeat

## Step 4: Common Refactors

### Split Large File
```
views.py (1000 lines)
→ views/
  ├── __init__.py
  ├── auth_views.py
  ├── vocab_views.py
  └── ai_views.py
```

### Extract Function
```python
# Before
def process():
    # ... 50 lines of code A ...
    # ... 50 lines of code B ...

# After
def process():
    _do_a()
    _do_b()
```

## Step 5: Verify
1. All tests still pass
2. No behavioral changes
3. Code is cleaner

## Hard Rules
- ❌ NEVER add new features during refactor
- ❌ NEVER change behavior
- ⚠️ Always have tests before refactoring
- ⚠️ Update context files if structure changes
