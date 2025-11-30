#!/bin/bash

# GitHub Secrets Setup Script
# Run this to add all 5 secrets to your repository

REPO="assadAllah630/vocab-web"

echo "Adding GitHub Secrets to $REPO..."

# Add VERCEL_TOKEN
gh secret set VERCEL_TOKEN --body "5KI2zkBTbjiOUM3vpn5oFK4e" --repo $REPO
echo "✅ Added VERCEL_TOKEN"

# Add VERCEL_ORG_ID
gh secret set VERCEL_ORG_ID --body "team_Ryk6Thf8BpeI3OSVAjsqt76n" --repo $REPO
echo "✅ Added VERCEL_ORG_ID"

# Add VERCEL_PROJECT_ID
gh secret set VERCEL_PROJECT_ID --body "prj_uBzt4CK7A9KGJUE2ehto4V04CZtX" --repo $REPO
echo "✅ Added VERCEL_PROJECT_ID"

# Add VITE_API_URL
gh secret set VITE_API_URL --body "https://vocab-web-03t1.onrender.com" --repo $REPO
echo "✅ Added VITE_API_URL"

# Add VITE_GOOGLE_CLIENT_ID
gh secret set VITE_GOOGLE_CLIENT_ID --body "1091940903056-altlhacvu1c3io4ilm2ssd3q84gh1j9p.apps.googleusercontent.com" --repo $REPO
echo "✅ Added VITE_GOOGLE_CLIENT_ID"

echo ""
echo "🎉 All 5 secrets added successfully!"
echo "You can now push your code to trigger deployment."
