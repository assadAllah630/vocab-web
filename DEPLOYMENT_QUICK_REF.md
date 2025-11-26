# 🚀 Quick Deployment Reference

## Environment Variables Checklist

### Backend (Render)

```bash
# Required
PYTHON_VERSION=3.11.0
DEBUG=False
DJANGO_SECRET_KEY=<generate-with-secrets.token_urlsafe(50)>
DATABASE_URL=<auto-provided-by-render>
ALLOWED_HOSTS=your-app.onrender.com
FRONTEND_URL=https://your-app.vercel.app

# OAuth & Email
GOOGLE_OAUTH_CLIENT_ID=<from-google-console>
GOOGLE_OAUTH_CLIENT_SECRET=<from-google-console>
GMAIL_USER=<your-gmail>
GMAIL_APP_PASSWORD=<from-google-account>
```

### Frontend (Vercel)

```bash
VITE_API_URL=https://your-app.onrender.com
VITE_GOOGLE_CLIENT_ID=<same-as-backend>
```

### GitHub Secrets

```bash
# Backend
RENDER_DEPLOY_HOOK=<from-render-settings>
BACKEND_URL=https://your-app.onrender.com

# Frontend
VERCEL_TOKEN=<from-vercel-account>
VERCEL_ORG_ID=<from-vercel-project>
VERCEL_PROJECT_ID=<from-vercel-project>
VITE_API_URL=https://your-app.onrender.com
VITE_GOOGLE_CLIENT_ID=<from-google-console>

# Database Backup
DATABASE_URL=<external-database-url-from-render>
```

---

## Deployment Commands

### Push to GitHub
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

### Manual Deploy Backend (Render)
- Go to Render Dashboard → Service → Manual Deploy

### Manual Deploy Frontend (Vercel)
```bash
cd client
vercel --prod
```

### Database Backup
```bash
# Manual backup
pg_dump "DATABASE_URL" > backup_$(date +%Y%m%d).sql

# Restore
psql "NEW_DATABASE_URL" < backup_20251126.sql
```

---

## URLs

### Development
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Admin: http://localhost:8000/admin

### Production
- Frontend: https://your-app.vercel.app
- Backend: https://your-app.onrender.com
- Admin: https://your-app.onrender.com/admin
- Health: https://your-app.onrender.com/api/health/

---

## Common Issues

### Cold Start (Render Free Tier)
- **Symptom**: First request takes 30-60 seconds
- **Solution**: Normal behavior, subsequent requests are fast

### CORS Error
- **Symptom**: Frontend can't connect to backend
- **Solution**: Check FRONTEND_URL in Render matches Vercel URL

### OAuth Not Working
- **Symptom**: Google login fails
- **Solution**: Add Vercel URL to Google OAuth authorized URIs

### Database Expired (90 days)
- **Symptom**: Database connection error
- **Solution**: Create new database, restore from backup

---

## Monitoring

### Check Backend Status
```bash
curl https://your-app.onrender.com/api/health/
```

### Check Logs
- **Render**: Dashboard → Service → Logs
- **Vercel**: Dashboard → Project → Deployments → Logs
- **GitHub Actions**: Repository → Actions tab

---

## Maintenance Schedule

- **Daily**: Monitor error logs
- **Weekly**: Check database size (free tier = 1GB)
- **Monthly**: Review API usage, update dependencies
- **Every 90 days**: Migrate to new database (free tier limit)

---

## Support

- 📖 [Full Deployment Guide](DEPLOYMENT.md)
- 🐛 [Report Issues](https://github.com/YOUR_USERNAME/vocab-web/issues)
- 💬 [Render Community](https://community.render.com/)
- 💬 [Vercel Discussions](https://github.com/vercel/vercel/discussions)
