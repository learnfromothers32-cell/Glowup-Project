# GlowUp Deployment Script
# Run this from the repo root after pushing to GitHub

Write-Host "=== GlowUp Deployment ===`n" -ForegroundColor Cyan

# ── 1. Check prerequisites ──
$hasGh = Get-Command "gh" -ErrorAction SilentlyContinue
$hasVercel = Get-Command "vercel" -ErrorAction SilentlyContinue

if (-not $hasGh) {
  Write-Host "[!] gh CLI not found. Install from https://cli.github.com/" -ForegroundColor Yellow
}
if (-not $hasVercel) {
  Write-Host "[!] Vercel CLI not found. Install with: npm i -g vercel" -ForegroundColor Yellow
}

# ── 2. Deploy Backend to Railway ──
if ($hasGh) {
  Write-Host "`n[1/2] Deploying backend to Railway..." -ForegroundColor Green
  Write-Host "  -> Make sure you have the Railway GitHub integration set up."
  Write-Host "  -> Push to GitHub, then connect your repo at https://railway.app"
  Write-Host "  -> Set these environment variables in Railway dashboard:" -ForegroundColor Yellow
  Write-Host "     - MONGODB_URI (MongoDB Atlas connection string)"
  Write-Host "     - JWT_SECRET"
  Write-Host "     - JWT_REFRESH_SECRET"
  Write-Host "     - CLIENT_URL (your Vercel frontend URL)"
  Write-Host "     - CLOUDINARY_CLOUD_NAME (optional)"
  Write-Host "     - CLOUDINARY_API_KEY (optional)"
  Write-Host "     - CLOUDINARY_API_SECRET (optional)"
  Write-Host "     - PAYSTACK_SECRET_KEY (optional)"
  Write-Host "     - FIREBASE_SERVICE_ACCOUNT (for social login)"
}

# ── 3. Deploy Frontend to Vercel ──
if ($hasVercel) {
  Write-Host "`n[2/2] Deploying frontend to Vercel..." -ForegroundColor Green
  Write-Host "  -> Run: cd client && vercel --prod" -ForegroundColor Yellow
  Write-Host "  -> Set these environment variables in Vercel dashboard:" -ForegroundColor Yellow
  Write-Host "     - VITE_API_BASE_URL=https://your-railway-app.up.railway.app/api"
  Write-Host "     - VITE_SOCKET_URL=https://your-railway-app.up.railway.app"
  Write-Host "     - VITE_FIREBASE_API_KEY (from .env)"
  Write-Host "     - VITE_FIREBASE_AUTH_DOMAIN (from .env)"
  Write-Host "     - VITE_FIREBASE_PROJECT_ID (from .env)"
  Write-Host "     - VITE_FIREBASE_STORAGE_BUCKET (from .env)"
  Write-Host "     - VITE_FIREBASE_MESSAGING_SENDER_ID (from .env)"
  Write-Host "     - VITE_FIREBASE_APP_ID (from .env)"
}

Write-Host "`n=== Quick Start ===" -ForegroundColor Cyan
Write-Host "1. Push to GitHub:  git push origin master"
Write-Host "2. Connect repo at https://railway.app (select server/ subdir)"
Write-Host "3. Add Railway env vars (see above)"
Write-Host "4. cd client && vercel --prod"
Write-Host "5. Add Vercel env vars (see above)"
Write-Host "6. Update CLIENT_URL in Railway to your Vercel URL`n"
