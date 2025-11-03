# PowerShell script to commit and push search improvements
cd "C:\Users\User\Downloads\gemini-real-time-voice-chat (1)"

Write-Host "Adding all changes..." -ForegroundColor Green
git add .

Write-Host "Committing changes..." -ForegroundColor Green
git commit -m "שיפור משמעותי בחיפוש בזמן אמת - בדיקת תאריכים, וידוא עדכניות, ואי שיתוף מידע ישן"

Write-Host "Pushing to GitHub..." -ForegroundColor Green
git push origin main

Write-Host "✅ Done!" -ForegroundColor Green

