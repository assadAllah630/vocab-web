# 🚀 VocabMaster - Production Deployment Guide

Complete step-by-step guide to deploy VocabMaster to production using **100% FREE services** (no credit card required).

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Step 1: Push to GitHub](#step-1-push-to-github)
4. [Step 2: Deploy Backend to Render](#step-2-deploy-backend-to-render)
5. [Step 3: Deploy Frontend to Vercel](#step-3-deploy-frontend-to-vercel)
6. [Step 4: Configure CI/CD](#step-4-configure-cicd)
7. [Step 5: Verification](#step-5-verification)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)

---

## Prerequisites

### Required Accounts (All Free)

1. **GitHub Account** - [Sign up](https://github.com/signup)
2. **Render Account** - [Sign up](https://render.com/register)
3. **Vercel Account** - [Sign up](https://vercel.com/signup)

### Required Credentials

- Google OAuth Client ID and Secret ([Get here](https://console.cloud.google.com/apis/credentials))
- Gmail App Password ([Get here](https://myaccount.google.com/apppasswords))
- API Keys (configured in app settings after deployment):
  - Gemini API Key ([Get here](https://aistudio.google.com/app/apikey))
  - OpenRouter API Key (optional) ([Get here](https://openrouter.ai/keys))
  - Stable Horde API Key (optional) ([Get here](https://stablehorde.net/register))

---

## Architecture Overview

```
┌─────────────────┐
│  GitHub Repo    │
│  (Source Code)  │
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌────────────────┐  ┌───────────────┐  ┌──────────────┐
│ GitHub Actions │  │ Render        │  │ Vercel       │
│ (CI/CD)        │  │ - Backend API │  │ - Frontend   │
│                │  │ - PostgreSQL  │  │ - React App  │
└────────────────┘  └───────────────┘  └──────────────┘
```

**Services Used:**
- **Render**: Backend Django API + PostgreSQL Database (Free tier)
- **Vercel**: Frontend React App (Hobby tier - free)
- **GitHub Actions**: CI/CD Pipeline (Free for public repos)

---

## Step 1: Push to GitHub

### 1.1 Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create a new repository named `vocab-web`
3. Set visibility to **Public** (for unlimited GitHub Actions minutes)
4. **Do NOT** initialize with README (we already have one)

### 1.2 Push Code to GitHub

```bash
# Navigate to your project
cd e:\vocab_web

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - VocabMaster ready for deployment"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/vocab-web.git

# Push to main branch
git branch -M main
git push -u origin main
```

✅ **Checkpoint**: Your code should now be visible on GitHub

---

## Step 2: Deploy Backend to Render

### 2.1 Create Render Account

1. Go to [Render](https://render.com/register)
2. Sign up with GitHub (recommended for easy integration)
3. Authorize Render to access your repositories

### 2.2 Create PostgreSQL Database

1. From Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `vocabmaster-db`
   - **Database**: `vocabmaster`
   - **User**: `vocabmaster`
   - **Region**: Choose closest to you (e.g., Frankfurt, Oregon, Singapore)
   - **Plan**: **Free**
3. Click **"Create Database"**
4. Wait for database to be created (~1-2 minutes)
5. **Save the following** (you'll need them):
   - Internal Database URL (starts with `postgresql://`)
   - External Database URL (for backups)

> [!WARNING]
> **Free PostgreSQL expires after 90 days!** Set up automated backups (covered in Step 4).

### 2.3 Create Web Service

1. From Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository `vocab-web`
3. Configure:
   - **Name**: `vocabmaster-api`
   - **Region**: **Same as database** (important!)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Python 3`
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn vocab_server.wsgi:application --bind 0.0.0.0:$PORT`
   - **Plan**: **Free**

4. Click **"Advanced"** and add environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `PYTHON_VERSION` | `3.11.0` | |
| `DEBUG` | `False` | Production mode |
| `DJANGO_SECRET_KEY` | *(Generate below)* | Use secret generator |
| `DATABASE_URL` | *(From Step 2.2)* | Internal Database URL |
| `ALLOWED_HOSTS` | `vocabmaster-api.onrender.com` | Your Render domain |
| `FRONTEND_URL` | *(Will add in Step 3)* | Your Vercel domain |
| `GOOGLE_OAUTH_CLIENT_ID` | *(Your Google OAuth ID)* | From Google Console |
| `GOOGLE_OAUTH_CLIENT_SECRET` | *(Your Google OAuth Secret)* | From Google Console |
| `GMAIL_USER` | *(Your Gmail)* | For sending emails |
| `GMAIL_APP_PASSWORD` | *(Your Gmail App Password)* | From Google Account |

**Generate Django Secret Key:**
```python
# Run this in Python to generate a secure key
import secrets
print(secrets.token_urlsafe(50))
```

5. Click **"Create Web Service"**
6. Wait for deployment (~5-10 minutes for first deploy)

### 2.4 Verify Backend

1. Once deployed, visit: `https://vocabmaster-api.onrender.com/api/health/`
2. You should see: `{"status": "healthy"}`

✅ **Checkpoint**: Backend is live!

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account

1. Go to [Vercel](https://vercel.com/signup)
2. Sign up with GitHub (recommended)
3. Authorize Vercel to access your repositories

### 3.2 Import Project

1. From Vercel Dashboard, click **"Add New..."** → **"Project"**
2. Import your `vocab-web` repository
3. Configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.3 Add Environment Variables

Click **"Environment Variables"** and add:

| Key | Value | Notes |
|-----|-------|-------|
| `VITE_API_URL` | `https://vocabmaster-api.onrender.com` | Your Render backend URL |
| `VITE_GOOGLE_CLIENT_ID` | *(Your Google OAuth Client ID)* | Same as backend |

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait for deployment (~2-3 minutes)
3. You'll get a URL like: `https://vocab-web-xyz.vercel.app`

### 3.5 Update Backend CORS

1. Go back to Render Dashboard
2. Open your `vocabmaster-api` service
3. Go to **"Environment"**
4. Update `FRONTEND_URL` to your Vercel URL: `https://vocab-web-xyz.vercel.app`
5. Save changes (this will trigger a redeploy)

### 3.6 Update Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Add to **Authorized JavaScript origins**:
   - `https://vocab-web-xyz.vercel.app`
4. Add to **Authorized redirect URIs**:
   - `https://vocab-web-xyz.vercel.app/auth/callback`
5. Save

✅ **Checkpoint**: Frontend is live and connected to backend!

---

## Step 4: Configure CI/CD

### 4.1 Get Render Deploy Hook

1. In Render Dashboard, open `vocabmaster-api`
2. Go to **"Settings"** → **"Deploy Hook"**
3. Copy the webhook URL (looks like: `https://api.render.com/deploy/srv-xxx?key=yyy`)

### 4.2 Get Vercel Token

1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Create a new token named "GitHub Actions"
3. Copy the token

### 4.3 Get Vercel Project IDs

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
cd client
vercel link

# Get project info
vercel project ls
```

Copy your:
- **Org ID** (from `.vercel/project.json`)
- **Project ID** (from `.vercel/project.json`)

### 4.4 Add GitHub Secrets

1. Go to your GitHub repository
2. Click **"Settings"** → **"Secrets and variables"** → **"Actions"**
3. Click **"New repository secret"** and add:

| Secret Name | Value |
|-------------|-------|
| `RENDER_DEPLOY_HOOK` | *(Render webhook URL from 4.1)* |
| `BACKEND_URL` | `https://vocabmaster-api.onrender.com` |
| `VERCEL_TOKEN` | *(Token from 4.2)* |
| `VERCEL_ORG_ID` | *(Org ID from 4.3)* |
| `VERCEL_PROJECT_ID` | *(Project ID from 4.3)* |
| `VITE_API_URL` | `https://vocabmaster-api.onrender.com` |
| `VITE_GOOGLE_CLIENT_ID` | *(Your Google OAuth Client ID)* |
| `DATABASE_URL` | *(External Database URL from Render)* |

### 4.5 Test CI/CD

1. Make a small change to your code
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test CI/CD pipeline"
   git push
   ```
3. Go to **"Actions"** tab in GitHub
4. Watch your workflows run!

✅ **Checkpoint**: CI/CD is working! Every push to `main` will auto-deploy.

---

## Step 5: Verification

### 5.1 Test Backend

```bash
# Health check
curl https://vocabmaster-api.onrender.com/api/health/

# Should return: {"status": "healthy"}
```

### 5.2 Test Frontend

1. Visit your Vercel URL: `https://vocab-web-xyz.vercel.app`
2. Try to sign up / log in
3. Add vocabulary
4. Test AI features

### 5.3 Test Full Flow

1. **Sign up** with email
2. **Verify email** (check spam folder)
3. **Add vocabulary** manually
4. **Take a quiz**
5. **Generate a story** (requires Gemini API key in settings)
6. **Test OAuth** login with Google

---

## Troubleshooting

### Backend Issues

#### ❌ "Application failed to respond"

**Cause**: Cold start (free tier spins down after 15 min)
**Solution**: Wait 30-60 seconds and refresh

#### ❌ "Database connection failed"

**Cause**: Wrong DATABASE_URL or database not created
**Solution**: 
1. Check DATABASE_URL in Render environment variables
2. Ensure database and web service are in same region

#### ❌ "Static files not loading"

**Cause**: Static files not collected
**Solution**: Check build logs, ensure `collectstatic` ran successfully

### Frontend Issues

#### ❌ "Network Error" when calling API

**Cause**: CORS not configured or wrong API URL
**Solution**:
1. Check `VITE_API_URL` in Vercel environment variables
2. Ensure `FRONTEND_URL` is set in Render
3. Check browser console for CORS errors

#### ❌ "Google OAuth not working"

**Cause**: Redirect URI not configured
**Solution**: Add Vercel URL to Google OAuth authorized redirect URIs

### CI/CD Issues

#### ❌ "Workflow not triggering"

**Cause**: Workflow file syntax error or wrong path
**Solution**: Check `.github/workflows/` files exist and are valid YAML

#### ❌ "Deployment failed"

**Cause**: Missing secrets or wrong values
**Solution**: Verify all GitHub secrets are set correctly

---

## Maintenance

### Database Backups

**Automated**: GitHub Actions runs weekly backups (every Sunday 2 AM UTC)

**Manual Backup**:
```bash
# Get DATABASE_URL from Render
pg_dump "YOUR_DATABASE_URL" > backup.sql
```

**Restore Backup**:
```bash
psql "YOUR_NEW_DATABASE_URL" < backup.sql
```

### Monitoring

**Backend Logs**: Render Dashboard → Service → Logs

**Frontend Logs**: Vercel Dashboard → Project → Deployments → Logs

**Uptime Monitoring** (optional free services):
- [UptimeRobot](https://uptimerobot.com/) - Free for 50 monitors
- [Freshping](https://www.freshworks.com/website-monitoring/) - Free for 50 checks

### Updating Dependencies

**Backend**:
```bash
cd server
pip install --upgrade <package>
pip freeze > requirements.txt
git commit -am "Update dependencies"
git push
```

**Frontend**:
```bash
cd client
npm update
git commit -am "Update dependencies"
git push
```

### Scaling (When You Outgrow Free Tier)

**Render Paid Plans** ($7/month):
- No cold starts
- More resources
- Persistent database

**Vercel Pro** ($20/month):
- More bandwidth
- Analytics
- Team features

---

## 🎉 Congratulations!

Your VocabMaster app is now live in production with:

✅ Automated deployments on every push
✅ Weekly database backups
✅ Production-ready security settings
✅ Free hosting (no credit card required)

**Your URLs**:
- **Frontend**: `https://vocab-web-xyz.vercel.app`
- **Backend API**: `https://vocabmaster-api.onrender.com`
- **Admin Panel**: `https://vocabmaster-api.onrender.com/admin`

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)

---

## 🆘 Need Help?

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/vocab-web/issues)
- **Render Support**: [Render Community](https://community.render.com/)
- **Vercel Support**: [Vercel Discussions](https://github.com/vercel/vercel/discussions)
