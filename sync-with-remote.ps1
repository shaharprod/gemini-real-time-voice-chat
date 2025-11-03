# סנכרן עם ה-remote
Write-Host "Pulling changes from remote..." -ForegroundColor Yellow
git pull origin main --allow-unrelated-histories

# אם יש conflicts, זה יפעיל merge editor
# אחרי שתסגור את ה-editor, הרץ: git push origin main

Write-Host "`nAfter resolving any conflicts (if any), run: git push origin main" -ForegroundColor Green

