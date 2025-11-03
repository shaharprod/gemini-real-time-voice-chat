# Complete deployment - commit and push
Set-Location "c:\Users\User\Downloads\gemini-real-time-voice-chat (1)"

Write-Host "🚀 Complete deployment to GitHub..." -ForegroundColor Cyan

Write-Host "`n1. Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host "`n2. Committing..." -ForegroundColor Yellow
git commit -m "Fix: Add build verification and ensure GitHub Pages deployment works

- Added build output verification step in GitHub Actions
- Ensured API key is properly passed to build
- All features: dictation mode, TXT export, conversation history
- Ready for production deployment"

Write-Host "`n3. Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "`n📋 GitHub Actions will deploy automatically..." -ForegroundColor Cyan
    Write-Host "`n⏳ Wait 1-2 minutes for deployment" -ForegroundColor Yellow
    Write-Host "`nCheck: https://github.com/shaharprod/gemini-real-time-voice-chat/actions" -ForegroundColor White
    Write-Host "Site: https://shaharprod.github.io/gemini-real-time-voice-chat/" -ForegroundColor White
} else {
    Write-Host "`n❌ Push failed! Exit code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

