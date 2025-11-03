# Commit and push all final improvements
Set-Location "c:\Users\User\Downloads\gemini-real-time-voice-chat (1)"

Write-Host "🚀 Committing and pushing all final improvements..." -ForegroundColor Cyan

Write-Host "`n1. Checking git status..." -ForegroundColor Yellow
git status --short

Write-Host "`n2. Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host "`n3. Committing all improvements..." -ForegroundColor Yellow
git commit -m "Fix: Improve article URL extraction and system instructions

- Enhanced systemInstruction to require SPECIFIC article URLs (not homepages)
- Added URL filtering to exclude homepage URLs (like www.walla.co.il)
- Only URLs with specific paths (like /item/, /article/) are now kept
- Added helpful message when no article URLs are found
- Improved user instructions for using article reading buttons
- Better guidance for users when article sources are not available
- Fixed issue where system provided homepage URLs instead of specific articles"

Write-Host "`n4. Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "`n📋 GitHub Actions will deploy automatically..." -ForegroundColor Cyan
    Write-Host "`n⏳ Wait 1-2 minutes for deployment to complete" -ForegroundColor Yellow
    Write-Host "`n🌐 After deployment, site will be at:" -ForegroundColor White
    Write-Host "   https://shaharprod.github.io/gemini-real-time-voice-chat/" -ForegroundColor Cyan
    Write-Host "`n📊 Check deployment status:" -ForegroundColor White
    Write-Host "   https://github.com/shaharprod/gemini-real-time-voice-chat/actions" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Push failed! Checking status..." -ForegroundColor Red
    git status
    exit 1
}

