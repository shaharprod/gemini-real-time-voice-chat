# PowerShell script to commit and push all improvements
cd "C:\Users\User\Downloads\gemini-real-time-voice-chat (1)"

Write-Host "Adding all changes..." -ForegroundColor Green
git add .

Write-Host "Committing changes..." -ForegroundColor Green
git commit -m "שיפורים: כפתור השתקת האסיסטנט בזמן אמת, שיפור חיפוש בזמן אמת, ותיקוני UI"

Write-Host "Pushing to GitHub..." -ForegroundColor Green
git push origin main

Write-Host "✅ Done!" -ForegroundColor Green
