# PowerShell script to commit and push all final improvements
cd "C:\Users\User\Downloads\gemini-real-time-voice-chat (1)"

Write-Host "Adding all changes..." -ForegroundColor Green
git add .

Write-Host "Committing changes..." -ForegroundColor Green
git commit -m "שיפורים: שיפור הקראת כותרות וכתבות, שיפור נראות הממשק, כפתורי ON/OFF בצבעים, והנחיות מפורשות לספק URLs של מאמרים"

Write-Host "Pushing to GitHub..." -ForegroundColor Green
git push origin main

Write-Host "✅ Done!" -ForegroundColor Green

