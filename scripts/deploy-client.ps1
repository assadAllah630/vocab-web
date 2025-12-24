# Safe Deployment Script for VocabMaster Client
# Target: vocab-web-4ywv.vercel.app (Production Only)

Write-Host "🚀 Deploying to Production..." -ForegroundColor Cyan

# 1. Check for Token
if (-not (Test-Path ".vercel-token")) {
    Write-Error "❌ Error: .vercel-token file not found!"
    exit 1
}

$env:VERCEL_TOKEN = (Get-Content .vercel-token -Raw).Trim()

# 2. Navigate to Client Directory
Set-Location "client"

# 3. Deploy to Production (Quietly)
# We capture the output to avoid showing the confusing temporary URLs
$deploymentUrl = vercel --prod --token $env:VERCEL_TOKEN --yes

# 4. Return to Root
Set-Location ..

# 5. Show ONLY the Official URL
Write-Host "---------------------------------------------------" -ForegroundColor DarkGray
Write-Host "✅ UPDATE COMPLETE" -ForegroundColor Green
Write-Host "🌎 Official URL: https://vocab-web-4ywv.vercel.app/" -ForegroundColor White -BackgroundColor Blue
Write-Host "---------------------------------------------------" -ForegroundColor DarkGray
