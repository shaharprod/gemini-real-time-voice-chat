# Commit and push to GitHub
Write-Host "🚀 Committing and pushing changes..." -ForegroundColor Cyan

Set-Location "c:\Users\User\Downloads\gemini-real-time-voice-chat (1)"

Write-Host "`n1. Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host "2. Committing..." -ForegroundColor Yellow
git commit -m "Add: Text-to-speech for history and TXT file reading functionality"

Write-Host "3. Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host "`n✅ Done! Changes pushed to GitHub." -ForegroundColor Green
