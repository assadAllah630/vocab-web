# Refactor Workflow

## Context Loading

Load these files before starting:
1. **Backend**: `.context/modules/backend/<module>.context.md`
2. **Frontend**: `.context/modules/frontend/<area>.context.md`
3. **Mobile**: `.context/modules/mobile/<area>.context.md`
4. **Admin**: `.context/modules/admin/<area>.context.md`
5. `.context/conventions.md`

---

## Refactor Rules

### Non-Negotiable

- ❌ **No new features** during refactor
- ❌ **No behavioral changes**
- ❌ **Public API must stay the same**
- ✅ Tests MUST remain green throughout

---

## Refactor Steps

### 1. Run All Tests First

```bash
pytest server/api/tests/
npm test  # frontend
```

All tests must pass before starting.

### 2. Create Refactor Branch

```bash
git checkout -b refactor/<module>-<description>
```

### 3. Apply Refactor in Small Steps

- Make one change at a time
- Run tests after each change
- Commit working states

### 4. Common Refactors

**Extract Function:**
```python
# Before
def big_function():
    # 100 lines...

# After
def big_function():
    result = _helper_function()
    ...
```

**Rename for Clarity:**
```python
# Before
def proc(x):
    ...

# After
def process_vocabulary_import(file_content):
    ...
```

**Move to Correct Location:**
```python
# Move from wrong module to correct module
# Update imports
```

### 5. Re-Run All Tests

```bash
pytest server/api/tests/
npm test
```

All must pass!

### 6. Update Context if Structure Changed

- Document new file locations
- Update file references

---

## Commit Format

```
refactor(<module>): short description

- Extracted <function>
- Renamed <old> to <new>
- No behavioral changes
```

---

## Post-Refactor Checklist

- [ ] All tests pass
- [ ] No new features added
- [ ] Public API unchanged
- [ ] Imports updated
- [ ] Context updated (if structure changed)
- [ ] PR clearly states "refactor only"

---

## Hard Rules

- ❌ Never refactor and add features in same PR
- ❌ Never skip tests during refactor
- ❌ Never change behavior "while we're at it"
