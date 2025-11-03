# תסריט לתיקון ה-remote של Git

# הסר את ה-remote הישן אם קיים
git remote remove origin

# הוסף את ה-remote הנכון
git remote add origin https://github.com/shaharprod/gemini-real-time-voice-chat.git

# בדוק שהכל תקין
Write-Host "Remote configured:" -ForegroundColor Green
git remote -v

Write-Host "`nNow you can run: npm run deploy" -ForegroundColor Yellow

