# פריסה סופית - כולל כל השינויים האחרונים
Write-Host "🚀 Starting final deployment..." -ForegroundColor Cyan

Write-Host "`n1. Checking git status..." -ForegroundColor Yellow
git status

Write-Host "`n2. Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host "3. Committing changes..." -ForegroundColor Yellow
git commit -m "Add: Internet search support, conversation history saving, and UI improvements"

Write-Host "4. Pushing to GitHub..." -ForegroundColor Yellow
git push origin main --force

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Check deployment: https://github.com/shaharprod/gemini-real-time-voice-chat/actions" -ForegroundColor White
Write-Host "2. Wait for deployment to complete (few minutes)" -ForegroundColor White
Write-Host "3. Visit: https://shaharprod.github.io/gemini-real-time-voice-chat/" -ForegroundColor White
Write-Host "`n🎉 New features:" -ForegroundColor Yellow
Write-Host "- Internet search support (Google Search grounding)" -ForegroundColor White
Write-Host "- Conversation history saving (localStorage)" -ForegroundColor White
Write-Host "- Export/Import history (JSON)" -ForegroundColor White
Write-Host "- Clear history button" -ForegroundColor White

