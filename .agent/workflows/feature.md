---
description: Add a new feature to VocabMaster
---

## Context
Load appropriate context file from `.context/modules/`

## Step 1: Understand Requirements
- What is the feature?
- Which module(s) does it affect?
- Is it backend, frontend, or both?

## Step 2: Plan
1. Database changes needed?
2. API endpoints needed?
3. UI components needed?
4. AI integration needed?

## Step 3: Implement Backend
1. Update models (if needed) → run migrations
2. Create/update serializers
3. Create/update views
4. Register URLs
5. Write tests

## Step 4: Implement Frontend
1. Create/update components
2. Connect to API
3. Add loading/error states
4. Add to router (if new page)

## Step 5: Test
1. Manual testing
2. Write automated tests
3. Check error cases

## Step 6: Document
Update relevant `.context/` files if needed.

## Hard Rules
- ❌ NEVER modify models without migration
- ❌ NEVER skip tests
- ⚠️ Use unified_ai for AI features
- ⚠️ Use api.js for frontend API calls
