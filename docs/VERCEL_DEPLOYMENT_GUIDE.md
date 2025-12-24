# Vercel Deployment Guide

## ✅ GitHub Push - COMPLETED
Your code has been successfully pushed to GitHub:
- Repository: https://github.com/assadAllah630/vocab-web
- Latest commit: "Update landing page components and sections"

## 🚀 Vercel Deployment Options

### Option 1: Deploy via Vercel Dashboard (Recommended)

#### Deploy Main Client (Landing Page)
1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click "Import Project"
3. Select "Import Git Repository"
4. Choose your repository: `assadAllah630/vocab-web`
5. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. Add Environment Variables (if needed):
   - `VITE_API_URL` - Your backend API URL
   - Any other environment variables from `.env`
7. Click "Deploy"

#### Deploy Admin Panel
1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click "Import Project"
3. Select the same repository: `assadAllah630/vocab-web`
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `admin-client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Add Environment Variables:
   - `VITE_API_URL` - Your backend API URL
6. Click "Deploy"

### Option 2: Deploy via CLI with Token

If you prefer using the CLI:

1. **Get Vercel Token**:
   - Go to https://vercel.com/account/tokens
   - Create a new token
   - Copy the token

2. **Set Token as Environment Variable**:
   ```powershell
   $env:VERCEL_TOKEN = "your-token-here"
   ```

3. **Deploy Main Client**:
   ```powershell
   cd client
   vercel --prod --token=$env:VERCEL_TOKEN
   ```

4. **Deploy Admin Panel**:
   ```powershell
   cd admin-client
   vercel --prod --token=$env:VERCEL_TOKEN
   ```

## 📝 Important Notes

### Environment Variables
Make sure to add these environment variables in Vercel:

**For Main Client (`client`)**:
- `VITE_API_URL` - Your backend API URL (e.g., https://your-backend.render.com)
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID (if using Google auth)

**For Admin Panel (`admin-client`)**:
- `VITE_API_URL` - Your backend API URL
- Any other admin-specific variables

### Backend Deployment
Don't forget to deploy your backend to Render or another hosting service:
- The backend is in the `server` directory
- Update CORS settings to allow your Vercel domains
- Update allowed hosts in Django settings

### Post-Deployment Checklist
- [ ] Main client deployed successfully
- [ ] Admin panel deployed successfully
- [ ] Environment variables configured
- [ ] Backend API is accessible
- [ ] CORS configured for Vercel domains
- [ ] Test all features on production
- [ ] Update README with live URLs

## 🔗 Useful Links
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Repository](https://github.com/assadAllah630/vocab-web)
