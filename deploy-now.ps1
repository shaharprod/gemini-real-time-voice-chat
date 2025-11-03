# פריסה סופית עם כל התכונות
Write-Host "🚀 Starting deployment..." -ForegroundColor Cyan

Write-Host "`n1. Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host "2. Committing..." -ForegroundColor Yellow
git commit -m "Add: Internet search (Google Search grounding), conversation history saving, export/import, and UI improvements"

Write-Host "3. Pushing to GitHub..." -ForegroundColor Yellow
git push origin main --force

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "`n📋 Check deployment:" -ForegroundColor Cyan
Write-Host "https://github.com/shaharprod/gemini-real-time-voice-chat/actions" -ForegroundColor White
