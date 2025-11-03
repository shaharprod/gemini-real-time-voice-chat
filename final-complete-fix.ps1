# Final complete fix - ensure everything works
Set-Location "c:\Users\User\Downloads\gemini-real-time-voice-chat (1)"

Write-Host "🔧 Final complete fix..." -ForegroundColor Cyan

Write-Host "`n1. Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host "`n2. Committing..." -ForegroundColor Yellow
git commit -m "Fix: Ensure API key is properly passed (support both GEMINI_API_KEY and API_KEY)"

Write-Host "`n3. Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host "`n✅ Done! Changes pushed." -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Wait for GitHub Actions to deploy (usually 1-2 minutes)" -ForegroundColor White
Write-Host "2. Check GitHub Actions: https://github.com/shaharprod/gemini-real-time-voice-chat/actions" -ForegroundColor White
Write-Host "3. Verify site: https://shaharprod.github.io/gemini-real-time-voice-chat/" -ForegroundColor White
Write-Host "`n⚠️  Important:" -ForegroundColor Yellow
Write-Host "- Make sure GEMINI_API_KEY is set in GitHub Secrets" -ForegroundColor White
Write-Host "- If site still doesn't work, check browser console (F12) for errors" -ForegroundColor White

