# פריסה מלאה ל-GitHub Pages
Write-Host "🚀 Starting deployment..." -ForegroundColor Cyan

Write-Host "`n1. Adding package-lock.json..." -ForegroundColor Yellow
git add package-lock.json .gitignore

Write-Host "2. Adding all other changes..." -ForegroundColor Yellow
git add .

Write-Host "3. Committing changes..." -ForegroundColor Yellow
git commit -m "Deploy: Add package-lock.json and update configuration"

Write-Host "4. Pushing to GitHub..." -ForegroundColor Yellow
git push origin main --force

Write-Host "`n✅ Deployment triggered!" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Check deployment: https://github.com/shaharprod/gemini-real-time-voice-chat/actions" -ForegroundColor White
Write-Host "2. Wait for deployment to complete (few minutes)" -ForegroundColor White
Write-Host "3. Visit: https://shaharprod.github.io/gemini-real-time-voice-chat/" -ForegroundColor White
Write-Host "`n⏳ Deployment is running..." -ForegroundColor Yellow

