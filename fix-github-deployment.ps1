# Fix GitHub deployment - commit and push all changes
Set-Location "c:\Users\User\Downloads\gemini-real-time-voice-chat (1)"

Write-Host "🔧 Fixing GitHub deployment..." -ForegroundColor Cyan

Write-Host "`n1. Checking git status..." -ForegroundColor Yellow
git status

Write-Host "`n2. Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host "`n3. Committing..." -ForegroundColor Yellow
git commit -m "Fix: Ensure all features work on GitHub Pages

- Fixed dictation mode recognition restart
- TXT export contains only user text (clean format)
- Verified API key passing in build
- All features tested locally"

Write-Host "`n4. Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully pushed!" -ForegroundColor Green
    Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Wait 1-2 minutes for deployment" -ForegroundColor White
    Write-Host "2. Check GitHub Actions: https://github.com/shaharprod/gemini-real-time-voice-chat/actions" -ForegroundColor White
    Write-Host "3. Verify site: https://shaharprod.github.io/gemini-real-time-voice-chat/" -ForegroundColor White
    Write-Host "`n⚠️  If still not working:" -ForegroundColor Yellow
    Write-Host "- Check browser console (F12) for JavaScript errors" -ForegroundColor White
    Write-Host "- Verify GEMINI_API_KEY is set in GitHub Secrets" -ForegroundColor White
    Write-Host "- Check GitHub Actions logs for build errors" -ForegroundColor White
} else {
    Write-Host "`n❌ Push failed! Exit code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

