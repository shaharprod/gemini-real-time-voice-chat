# Final commit and push - everything works
Set-Location "c:\Users\User\Downloads\gemini-real-time-voice-chat (1)"

Write-Host "🚀 Committing and pushing all changes..." -ForegroundColor Cyan

git add .
git commit -m "Add: Dictation mode and TXT export features

- Added dictation-only mode (Web Speech API, no AI responses)
- Added export conversation to TXT file (clean user text only)
- Added FileTextIcon component
- Added TRANSCRIBING status indicator
- Fixed dictation mode recognition restart
- All features working correctly"

git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "`n📋 GitHub Actions will deploy automatically..." -ForegroundColor Cyan
    Write-Host "Check: https://github.com/shaharprod/gemini-real-time-voice-chat/actions" -ForegroundColor White
    Write-Host "Site: https://shaharprod.github.io/gemini-real-time-voice-chat/" -ForegroundColor White
} else {
    Write-Host "`n❌ Push failed!" -ForegroundColor Red
    exit 1
}

