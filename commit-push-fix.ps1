# Commit and push all fixes
Set-Location "c:\Users\User\Downloads\gemini-real-time-voice-chat (1)"

Write-Host "🚀 Committing and pushing all fixes..." -ForegroundColor Cyan

Write-Host "`n1. Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host "`n2. Committing..." -ForegroundColor Yellow
git commit -m "Fix: Dictation mode and TXT export improvements

- Fixed dictation mode recognition restart issue
- TXT export now contains only user text (clean, no labels)
- Added FileTextIcon component for TXT export
- All features tested and working"

Write-Host "`n3. Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "`n📋 Deployment will start automatically..." -ForegroundColor Cyan
    Write-Host "Check: https://github.com/shaharprod/gemini-real-time-voice-chat/actions" -ForegroundColor White
    Write-Host "Site: https://shaharprod.github.io/gemini-real-time-voice-chat/" -ForegroundColor White
    Write-Host "`n⏳ Wait 1-2 minutes for deployment to complete" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Push failed! Exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Please check the error and try again." -ForegroundColor Yellow
    exit 1
}

