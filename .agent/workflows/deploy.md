---
description: Deploy VocabMaster to production (Render + Vercel)
---

## 🚀 Pre-Deployment Checklist
- [ ] **Clean Working Directory**: Ensure no uncommitted changes (`git status`)
- [ ] **Latest Code**: Pull latest changes (`git pull origin main`)
- [ ] **Tests Pass**: Run backend tests (`py manage.py test`)
- [ ] **Frontend Healthy**: Lint check (`cd client && npm run lint`)
- [ ] **Migrations**: Ensure local DB is in sync (`py manage.py migrate`)

## 📦 Step 1: Prepare Backend
```bash
# Windows
py -m pip freeze > requirements.txt
py manage.py check --deploy  # Django security check
py manage.py test api.tests  # Run core API tests
```

> [!IMPORTANT]
> **Requirements.txt**: Ensure `requirements.txt` is updated before deploying! Render relies on this file.

## 🔨 Step 2: Push to GitHub
```bash
git add .
git commit -m "deploy: <description>"
git push origin main
```
*This automatically triggers builds on Render (Backend) and Vercel (Frontend).*

## 🌐 Step 3: Verify Deployment (Crucial!)

### Backend Health Check (Render)
Wait ~5 minutes after push, then verify:
```bash
# 1. General Health
curl https://vocab-web-03t1.onrender.com/api/health/

# 2. AI Gateway Status
curl https://vocab-web-03t1.onrender.com/api/ai/gateway-status/
```
> Expected Output: `{"status":"healthy" ...}`

### Frontend Verification (Vercel)
- Visit: [https://vocab-web-4ywv.vercel.app/](https://vocab-web-4ywv.vercel.app/)
- **Smoke Test**: 
  1. Log in (if strictly private) or check public landing
  2. Verify API connection (do you see data?)
  3. Check console for errors (F12)

## 🔄 Rollback Strategy (Emergency)
If the deployment breaks production:
```bash
# 1. Revert the last commit
git revert HEAD
# 2. Push the revert immediately
git push origin main
```

## ⛔ Hard Rules
- ❌ **NEVER** deploy if local tests fail.
- ❌ **NEVER** push `.env` files or secrets to GitHub.
- ⚠️ **ALWAYS** check Render dashboard logs if the URL returns 502/500 errors.
