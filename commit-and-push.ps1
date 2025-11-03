# Commit and push to GitHub
Set-Location "c:\Users\User\Downloads\gemini-real-time-voice-chat (1)"

Write-Host "🚀 Committing and pushing to GitHub..." -ForegroundColor Cyan

Write-Host "`n1. Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host "`n2. Committing..." -ForegroundColor Yellow
git commit -m "Add: Dictation-only mode and export to TXT file

- Added dictation-only mode using Web Speech API (no AI responses)
- Added export conversation to TXT file feature
- Added FileTextIcon component
- Added TRANSCRIBING status indicator
- Dictation mode supports Hebrew and other languages"

Write-Host "`n3. Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "`n📋 Deployment will start automatically!" -ForegroundColor Cyan
    Write-Host "Check: https://github.com/shaharprod/gemini-real-time-voice-chat/actions" -ForegroundColor White
    Write-Host "Site: https://shaharprod.github.io/gemini-real-time-voice-chat/" -ForegroundColor White
} else {
    Write-Host "`n❌ Push failed! Exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Please check the error and try again." -ForegroundColor Yellow
    exit 1
}
