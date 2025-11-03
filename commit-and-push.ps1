# Commit ו-Push עם force (ידרוס את ה-remote)
Write-Host "Checking git status..." -ForegroundColor Yellow
git status

Write-Host "`nAdding all changes..." -ForegroundColor Yellow
git add .

Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m "Update: latest changes with Google Cloud fixes"

Write-Host "Pushing to GitHub (force)..." -ForegroundColor Yellow
git push origin main --force

Write-Host "`n✅ Done! GitHub Actions should now deploy automatically." -ForegroundColor Green
Write-Host "Check deployment at: https://github.com/shaharprod/gemini-real-time-voice-chat/actions" -ForegroundColor Cyan

