# 📋 VocabMaster Deployment Checklist

Print this checklist and check off items as you complete them.

---

## ☑️ Pre-Deployment

- [ ] Code is committed and pushed to GitHub
- [ ] All tests pass locally
- [ ] Environment variables documented
- [ ] API keys ready (Google OAuth, Gmail)

---

## ☑️ Account Setup

- [ ] GitHub account created
- [ ] Render account created (sign up with GitHub)
- [ ] Vercel account created (sign up with GitHub)
- [ ] Google Cloud Console project created
- [ ] Gmail App Password generated

---

## ☑️ Backend Deployment (Render)

### Database
- [ ] Create PostgreSQL database
  - Name: `vocabmaster-db`
  - Region: Choose closest (Frankfurt/Oregon/Singapore)
  - Plan: Free
- [ ] Copy Internal Database URL
- [ ] Copy External Database URL (for backups)

### Web Service
- [ ] Create Web Service
  - Name: `vocabmaster-api`
  - Repository: `vocab-web`
  - Branch: `main`
  - Root Directory: `server`
  - Runtime: Python 3
  - Build Command: `./build.sh`
  - Start Command: `gunicorn vocab_server.wsgi:application --bind 0.0.0.0:$PORT`
  - Plan: Free

### Environment Variables
- [ ] `PYTHON_VERSION` = `3.11.0`
- [ ] `DEBUG` = `False`
- [ ] `DJANGO_SECRET_KEY` = *(generate with Python)*
- [ ] `DATABASE_URL` = *(auto-provided)*
- [ ] `ALLOWED_HOSTS` = `your-app.onrender.com`
- [ ] `FRONTEND_URL` = *(add after Vercel deployment)*
- [ ] `GOOGLE_OAUTH_CLIENT_ID` = *(from Google Console)*
- [ ] `GOOGLE_OAUTH_CLIENT_SECRET` = *(from Google Console)*
- [ ] `GMAIL_USER` = *(your Gmail)*
- [ ] `GMAIL_APP_PASSWORD` = *(from Google Account)*

### Verification
- [ ] Deployment completed successfully
- [ ] Visit: `https://your-app.onrender.com/api/health/`
- [ ] Response: `{"status": "healthy"}`
- [ ] Check logs for errors

---

## ☑️ Frontend Deployment (Vercel)

### Project Setup
- [ ] Import GitHub repository
  - Repository: `vocab-web`
  - Framework: Vite
  - Root Directory: `client`
  - Build Command: `npm run build`
  - Output Directory: `dist`

### Environment Variables
- [ ] `VITE_API_URL` = `https://your-app.onrender.com`
- [ ] `VITE_GOOGLE_CLIENT_ID` = *(same as backend)*

### Deployment
- [ ] Click "Deploy"
- [ ] Wait for deployment (~2-3 minutes)
- [ ] Copy Vercel URL: `https://vocab-web-xyz.vercel.app`

### Verification
- [ ] Visit Vercel URL
- [ ] Frontend loads without errors
- [ ] Check browser console (F12) for errors

---

## ☑️ Cross-Service Configuration

### Update Backend (Render)
- [ ] Go to Render Dashboard → `vocabmaster-api` → Environment
- [ ] Update `FRONTEND_URL` = `https://vocab-web-xyz.vercel.app`
- [ ] Save (triggers redeploy)
- [ ] Wait for redeploy (~3-5 minutes)

### Update Google OAuth
- [ ] Go to Google Cloud Console → Credentials
- [ ] Edit OAuth 2.0 Client ID
- [ ] Add to Authorized JavaScript origins:
  - [ ] `https://vocab-web-xyz.vercel.app`
- [ ] Add to Authorized redirect URIs:
  - [ ] `https://vocab-web-xyz.vercel.app/auth/callback`
- [ ] Save

---

## ☑️ CI/CD Setup (GitHub Actions)

### Get Render Deploy Hook
- [ ] Render Dashboard → `vocabmaster-api` → Settings
- [ ] Scroll to "Deploy Hook"
- [ ] Copy webhook URL

### Get Vercel Credentials
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Login: `vercel login`
- [ ] Link project: `cd client && vercel link`
- [ ] Get Org ID and Project ID from `.vercel/project.json`
- [ ] Create Vercel token at: https://vercel.com/account/tokens

### Add GitHub Secrets
Go to GitHub → Repository → Settings → Secrets → Actions

- [ ] `RENDER_DEPLOY_HOOK` = *(webhook URL)*
- [ ] `BACKEND_URL` = `https://your-app.onrender.com`
- [ ] `VERCEL_TOKEN` = *(from Vercel account)*
- [ ] `VERCEL_ORG_ID` = *(from .vercel/project.json)*
- [ ] `VERCEL_PROJECT_ID` = *(from .vercel/project.json)*
- [ ] `VITE_API_URL` = `https://your-app.onrender.com`
- [ ] `VITE_GOOGLE_CLIENT_ID` = *(from Google Console)*
- [ ] `DATABASE_URL` = *(External URL from Render)*

### Test CI/CD
- [ ] Make a small change (e.g., add comment to README)
- [ ] Commit and push: `git commit -am "Test CI/CD" && git push`
- [ ] Go to GitHub → Actions tab
- [ ] Verify workflows run successfully

---

## ☑️ Final Verification

### Backend Tests
- [ ] Health check: `curl https://your-app.onrender.com/api/health/`
- [ ] Admin panel: `https://your-app.onrender.com/admin`
- [ ] API endpoints respond correctly

### Frontend Tests
- [ ] Homepage loads
- [ ] No console errors (F12)
- [ ] Routing works (navigate between pages)

### Full Integration Tests
- [ ] Sign up with email
  - [ ] Receive verification email
  - [ ] Verify email successfully
- [ ] Log in with credentials
- [ ] Add vocabulary word
- [ ] Take a quiz
- [ ] Update profile
- [ ] Test OAuth login (Google)
- [ ] Generate AI content (requires API key in settings)
  - [ ] Story generation
  - [ ] Grammar topics
  - [ ] Dialogues

### Performance Tests
- [ ] First load (cold start) - expect 30-60 seconds
- [ ] Subsequent loads - expect <3 seconds
- [ ] API responses - expect <1 second

---

## ☑️ Post-Deployment

### Documentation
- [ ] Update README with production URLs
- [ ] Document any deployment issues encountered
- [ ] Save all credentials securely

### Monitoring Setup (Optional)
- [ ] Set up UptimeRobot for uptime monitoring
- [ ] Configure error tracking (e.g., Sentry)
- [ ] Set up analytics (e.g., Google Analytics)

### Backup Verification
- [ ] Check GitHub Actions → Workflows
- [ ] Verify "Weekly Database Backup" workflow exists
- [ ] Manually trigger backup to test
- [ ] Check GitHub Releases for backup file

### Share & Celebrate 🎉
- [ ] Share production URL with friends
- [ ] Post on social media
- [ ] Add to portfolio
- [ ] Update LinkedIn

---

## 🆘 Troubleshooting

If something doesn't work:

1. **Check Logs**
   - Render: Dashboard → Service → Logs
   - Vercel: Dashboard → Deployments → Logs
   - GitHub Actions: Repository → Actions

2. **Common Issues**
   - Cold start delay (Render free tier) - Normal, wait 60s
   - CORS errors - Check `FRONTEND_URL` in Render
   - OAuth not working - Check Google Console authorized URIs
   - Database errors - Check `DATABASE_URL` is set correctly

3. **Resources**
   - [DEPLOYMENT.md](../DEPLOYMENT.md) - Full guide
   - [DEPLOYMENT_QUICK_REF.md](../DEPLOYMENT_QUICK_REF.md) - Quick reference
   - Render Community: https://community.render.com/
   - Vercel Discussions: https://github.com/vercel/vercel/discussions

---

## 📊 Completion Status

- [ ] Pre-Deployment (4 items)
- [ ] Account Setup (5 items)
- [ ] Backend Deployment (15 items)
- [ ] Frontend Deployment (8 items)
- [ ] Cross-Service Configuration (6 items)
- [ ] CI/CD Setup (11 items)
- [ ] Final Verification (18 items)
- [ ] Post-Deployment (8 items)

**Total**: 75 checkboxes
**Estimated Time**: 2-3 hours

---

## ✅ Success!

When all items are checked, your VocabMaster app is:
- ✅ Live in production
- ✅ Automatically deploying on every push
- ✅ Backed up weekly
- ✅ Secure and production-ready
- ✅ 100% free to run

**Congratulations!** 🎉🚀
