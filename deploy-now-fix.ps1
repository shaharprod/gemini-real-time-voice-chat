# Deploy now with all fixes
Set-Location "c:\Users\User\Downloads\gemini-real-time-voice-chat (1)"

Write-Host "🚀 Deploying to GitHub with all fixes..." -ForegroundColor Cyan

git add .
git commit -m "Fix: Add build verification for GitHub Pages deployment"
git push origin main

Write-Host "`n✅ Pushed to GitHub!" -ForegroundColor Green
Write-Host "Check: https://github.com/shaharprod/gemini-real-time-voice-chat/actions" -ForegroundColor Cyan

