---
description: Fix a bug in VocabMaster
---

## Step 1: Reproduce
1. Document exact steps to reproduce
2. Note error messages and stack traces
3. Identify affected file(s)

## Step 2: Understand
Load context from `.context/modules/backend/<module>.context.md`

## Step 3: Find Root Cause
1. Add debug logging
2. Check browser console / Django logs
3. Trace the data flow

## Step 4: Fix
1. Make minimal change to fix the issue
2. Don't refactor unrelated code
3. Add null checks / error handling

## Step 5: Test
1. Verify the bug is fixed
2. Check for regressions
3. Test edge cases

## Step 6: Clean Up
1. Remove debug logging
2. Run all tests

## Commit Format
```
fix(<scope>): <short description>

- Root cause: <what was wrong>
- Solution: <what was fixed>
```

## Hard Rules
- ❌ NEVER fix bugs without understanding root cause
- ❌ NEVER skip testing the fix
- ⚠️ Remove all debug code before commit
