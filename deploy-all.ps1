# Complete Deployment Script for VocabMaster
# This script handles Git push and provides Vercel deployment instructions

Write-Host "🚀 VocabMaster Deployment Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Git Status Check
Write-Host "📊 Checking Git status..." -ForegroundColor Yellow
git status

# Step 2: Stage all changes
Write-Host ""
Write-Host "📦 Staging all changes..." -ForegroundColor Yellow
git add .

# Step 3: Commit changes
Write-Host ""
$commitMessage = Read-Host "Enter commit message (or press Enter for default)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m $commitMessage

# Step 4: Push to GitHub
Write-Host ""
Write-Host "⬆️  Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    
    # Step 5: Vercel Deployment Instructions
    Write-Host "🌐 VERCEL DEPLOYMENT OPTIONS" -ForegroundColor Cyan
    Write-Host "=============================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Option 1: Deploy via Vercel Dashboard (Recommended)" -ForegroundColor Yellow
    Write-Host "1. Go to: https://vercel.com/new" -ForegroundColor White
    Write-Host "2. Import your repository: assadAllah630/vocab-web" -ForegroundColor White
    Write-Host ""
    Write-Host "   For MAIN CLIENT (Landing Page):" -ForegroundColor Magenta
    Write-Host "   - Root Directory: client" -ForegroundColor White
    Write-Host "   - Framework: Vite" -ForegroundColor White
    Write-Host "   - Build Command: npm run build" -ForegroundColor White
    Write-Host "   - Output Directory: dist" -ForegroundColor White
    Write-Host ""
    Write-Host "   For ADMIN PANEL:" -ForegroundColor Magenta
    Write-Host "   - Root Directory: admin-client" -ForegroundColor White
    Write-Host "   - Framework: Vite" -ForegroundColor White
    Write-Host "   - Build Command: npm run build" -ForegroundColor White
    Write-Host "   - Output Directory: dist" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Option 2: Deploy via CLI" -ForegroundColor Yellow
    Write-Host "1. Get your Vercel token from: https://vercel.com/account/tokens" -ForegroundColor White
    Write-Host "2. Run the following commands:" -ForegroundColor White
    Write-Host ""
    Write-Host '   $env:VERCEL_TOKEN = "your-token-here"' -ForegroundColor Gray
    Write-Host '   cd client' -ForegroundColor Gray
    Write-Host '   vercel --prod --token=$env:VERCEL_TOKEN' -ForegroundColor Gray
    Write-Host '   cd ..\admin-client' -ForegroundColor Gray
    Write-Host '   vercel --prod --token=$env:VERCEL_TOKEN' -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "📝 Don't forget to add environment variables in Vercel:" -ForegroundColor Yellow
    Write-Host "   - VITE_API_URL (your backend URL)" -ForegroundColor White
    Write-Host "   - VITE_GOOGLE_CLIENT_ID (if using Google OAuth)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📖 For detailed instructions, see: VERCEL_DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
    Write-Host ""
    
    # Ask if user wants to deploy now
    Write-Host "Would you like to deploy to Vercel now? (y/n)" -ForegroundColor Yellow
    $deploy = Read-Host
    
    if ($deploy -eq 'y' -or $deploy -eq 'Y') {
        Write-Host ""
        Write-Host "Choose deployment method:" -ForegroundColor Yellow
        Write-Host "1. Open Vercel Dashboard in browser" -ForegroundColor White
        Write-Host "2. Deploy via CLI (requires token)" -ForegroundColor White
        $choice = Read-Host "Enter choice (1 or 2)"
        
        if ($choice -eq '1') {
            Write-Host "Opening Vercel Dashboard..." -ForegroundColor Green
            Start-Process "https://vercel.com/new"
        }
        elseif ($choice -eq '2') {
            $token = Read-Host "Enter your Vercel token"
            if (![string]::IsNullOrWhiteSpace($token)) {
                $env:VERCEL_TOKEN = $token
                
                Write-Host ""
                Write-Host "Deploying Main Client..." -ForegroundColor Cyan
                Set-Location client
                vercel --prod --token=$env:VERCEL_TOKEN
                
                Write-Host ""
                Write-Host "Deploying Admin Panel..." -ForegroundColor Cyan
                Set-Location ..\admin-client
                vercel --prod --token=$env:VERCEL_TOKEN
                
                Set-Location ..
                Write-Host ""
                Write-Host "✅ Deployment complete!" -ForegroundColor Green
            }
            else {
                Write-Host "❌ No token provided. Skipping CLI deployment." -ForegroundColor Red
            }
        }
    }
    
}
else {
    Write-Host ""
    Write-Host "❌ Failed to push to GitHub. Please check the error above." -ForegroundColor Red
    Write-Host ""
}

Write-Host ""
Write-Host "🎉 Deployment script completed!" -ForegroundColor Cyan
