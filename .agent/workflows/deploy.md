---
description: Deploy VocabMaster to production (Render + Vercel)
---

## Pre-Deploy Checklist
- [ ] All tests pass locally (`py manage.py test`)
- [ ] Frontend Linting passes (`cd client && npm run lint`)
- [ ] No console errors in browser  
- [ ] Environment variables set
- [ ] Database migrations ready

## Step 1: Prepare Backend
```bash
# Windows
py -m pip freeze > requirements.txt
py manage.py migrate
py manage.py test api.tests.test_auth  # Run specific tests if discovery fails
# Linux/Mac
# pip freeze > requirements.txt
# python manage.py migrate
# python manage.py test
```

> [!NOTE]
> If tests fail due to "Email not verified" or rate limits, ensure:
> 1. External services (Email/AI) are mocked in tests
> 2. Rate limit decorators are temporarily handled or mocked

## Step 2: Push to GitHub
```bash
git add .
git commit -m "deploy: <description>"
git push origin main
```

## Step 3: Verify Deployments
- **Backend (Render)**: Check build logs, verify migrations
- **Frontend (Vercel)**: Check build, test site
- **Admin (Vercel)**: Check admin build

## Step 4: Post-Deploy Verification
```bash
curl https://vocabmaster-backend.onrender.com/api/health/
curl https://vocabmaster-backend.onrender.com/api/ai-gateway/status/
```

## Rollback (If Needed)
```bash
git revert HEAD
git push origin main
```

## Hard Rules
- ❌ NEVER deploy without running tests first
- ❌ NEVER push secrets to GitHub
- ⚠️ Always check Render logs after deploy
