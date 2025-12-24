# GitHub Secrets Setup Script (PowerShell)
# Run this to add all 5 secrets to your repository

$GH = "C:\Program Files\GitHub CLI\gh.exe"
$REPO = "assadAllah630/vocab-web"

Write-Host "Using GitHub CLI at: $GH"
Write-Host "Adding GitHub Secrets to $REPO..."

# Authenticate first if needed
Write-Host "Checking authentication..."
& $GH auth status
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to GitHub..."
    & $GH auth login
}

# Add VERCEL_TOKEN
& $GH secret set VERCEL_TOKEN --body "5KI2zkBTbjiOUM3vpn5oFK4e" --repo $REPO
Write-Host "✅ Added VERCEL_TOKEN"

# Add VERCEL_ORG_ID
& $GH secret set VERCEL_ORG_ID --body "team_Ryk6Thf8BpeI3OSVAjsqt76n" --repo $REPO
Write-Host "✅ Added VERCEL_ORG_ID"

# Add VERCEL_PROJECT_ID
& $GH secret set VERCEL_PROJECT_ID --body "prj_uBzt4CK7A9KGJUE2ehto4V04CZtX" --repo $REPO
Write-Host "✅ Added VERCEL_PROJECT_ID"

# Add VITE_API_URL
& $GH secret set VITE_API_URL --body "https://vocab-web-03t1.onrender.com" --repo $REPO
Write-Host "✅ Added VITE_API_URL"

# Add VITE_GOOGLE_CLIENT_ID
& $GH secret set VITE_GOOGLE_CLIENT_ID --body "1091940903056-altlhacvu1c3io4ilm2ssd3q84gh1j9p.apps.googleusercontent.com" --repo $REPO
Write-Host "✅ Added VITE_GOOGLE_CLIENT_ID"

Write-Host ""
Write-Host "🎉 All 5 secrets added successfully!"
Write-Host "You can now push your code to trigger deployment."
