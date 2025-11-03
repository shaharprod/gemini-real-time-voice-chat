# Deploy now with new API key
Set-Location "c:\Users\User\Downloads\gemini-real-time-voice-chat (1)"

Write-Host "🚀 Starting deployment..." -ForegroundColor Cyan

Write-Host "`n1. Checking git status..." -ForegroundColor Yellow
git status

Write-Host "`n2. Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host "`n3. Committing..." -ForegroundColor Yellow
git commit -m "Fix: Ensure API key is properly passed (support both GEMINI_API_KEY and API_KEY)"

Write-Host "`n4. Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "`n📋 Deployment started automatically!" -ForegroundColor Cyan
    Write-Host "`n📊 Check GitHub Actions: https://github.com/shaharprod/gemini-real-time-voice-chat/actions" -ForegroundColor White
    Write-Host "🌐 Site URL: https://shaharprod.github.io/gemini-real-time-voice-chat/" -ForegroundColor White
    Write-Host "`n⏳ Wait 1-2 minutes for deployment to complete..." -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Push failed! Exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Please check the error above and try again." -ForegroundColor Yellow
    exit 1
}
