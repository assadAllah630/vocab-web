# Safe Deployment Script for VocabMaster Admin Panel
# Target: admin-client (Vercel)

Write-Host "Deploying Admin Panel to Production..." -ForegroundColor Cyan

# 1. Check if Vercel CLI is available
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Error "Error: Vercel CLI not found. Run 'npm i -g vercel'"
    exit 1
}

# 2. Key Check: Ensure we are in root (look for scripts/)
if (-not (Test-Path "scripts")) {
    Write-Warning "Please run this from the project root (e.g., .\scripts\deploy-admin.ps1)"
    # Try to adjust if inside scripts/
    if (Test-Path "..\admin-client") { Set-Location .. }
}

# 3. Navigate to Admin Client
if (-not (Test-Path "admin-client")) {
    Write-Error "Error: 'admin-client' directory not found."
    exit 1
}
Set-Location "admin-client"

Write-Host "Building and Deploying to Vercel (Production)..." -ForegroundColor Cyan

# 4. Deploy using CLI auth or Token
$verb = "vercel --prod --yes"
if ($env:VERCEL_TOKEN) {
    Write-Host "Using VERCEL_TOKEN for auth." -ForegroundColor Yellow
    $verb += " --token $env:VERCEL_TOKEN"
}

# We use cmd /c to ensure it runs properly in PowerShell context
cmd /c $verb

if ($LASTEXITCODE -ne 0) {
    Write-Error "Deployment failed. Try running 'vercel login' first."
    Set-Location ..
    exit 1
}

# 5. Return to Root
Set-Location ..

# 6. Success Message (URL will be in the output above)
Write-Host "UPDATE COMPLETE" -ForegroundColor Green
Write-Host "Check output above for the official Admin Panel URL." -ForegroundColor White -BackgroundColor Blue
