# Deploy Workflow

> Workflow for deploying VocabMaster to production.

## Pre-Deploy Checklist

- [ ] All tests pass locally
- [ ] No console errors in browser
- [ ] Environment variables set correctly
- [ ] Database migrations ready

---

## Step 1: Prepare Backend

```bash
# Check requirements are up to date
pip freeze > requirements.txt

# Run migrations locally first
python manage.py migrate

# Run tests
python manage.py test
```

---

## Step 2: Push to GitHub

```bash
git add .
git commit -m "deploy: <description>"
git push origin main
```

---

## Step 3: Verify Deployments

### Backend (Render)
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Check build logs
3. Verify migrations ran
4. Test API: `https://vocabmaster-backend.onrender.com/api/health/`

### Frontend (Vercel)
1. Go to [Vercel Dashboard](https://vercel.com)
2. Check build logs
3. Test site: `https://vocabmaster.vercel.app`

### Admin Panel (Vercel)
1. Check admin build
2. Test login: `https://vocabmaster-admin.vercel.app`

---

## Step 4: Post-Deploy Verification

```bash
# Test critical endpoints
curl https://vocabmaster-backend.onrender.com/api/health/

# Check AI Gateway
curl https://vocabmaster-backend.onrender.com/api/ai-gateway/status/
```

---

## Rollback (If Needed)

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or on Render
# Click "Rollback" on previous successful deploy
```

---

## Hard Rules

- ❌ NEVER deploy without running tests first
- ❌ NEVER push secrets to GitHub
- ⚠️ Always check Render logs after deploy
- ⚠️ Test AI features after deploy (they may have quota issues)
