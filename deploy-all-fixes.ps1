# Deploy all fixes
Set-Location "c:\Users\User\Downloads\gemini-real-time-voice-chat (1)"

Write-Host "🚀 Deploying all fixes to GitHub..." -ForegroundColor Cyan

Write-Host "`n1. Checking status..." -ForegroundColor Yellow
git status

Write-Host "`n2. Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host "`n3. Committing..." -ForegroundColor Yellow
git commit -m "Fix: Dictation mode restart and TXT export format

- Fixed dictation mode recognition restart (removed status check dependency)
- TXT export now exports only user text (clean, no labels, no assistant responses)
- Improved error handling"

Write-Host "`n4. Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "`n📋 GitHub Actions will deploy automatically..." -ForegroundColor Cyan
    Write-Host "`nCheck deployment: https://github.com/shaharprod/gemini-real-time-voice-chat/actions" -ForegroundColor White
    Write-Host "Site URL: https://shaharprod.github.io/gemini-real-time-voice-chat/" -ForegroundColor White
    Write-Host "`n⏳ Wait 1-2 minutes for deployment to complete" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Push failed! Exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Try running manually:" -ForegroundColor Yellow
    Write-Host "  git push origin main" -ForegroundColor White
    exit 1
}

