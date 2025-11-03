# Commit and push UI improvements and article reading enhancements
Set-Location "c:\Users\User\Downloads\gemini-real-time-voice-chat (1)"

Write-Host "🚀 Committing and pushing all improvements..." -ForegroundColor Cyan

Write-Host "`n1. Checking git status..." -ForegroundColor Yellow
git status --short

Write-Host "`n2. Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host "`n3. Committing..." -ForegroundColor Yellow
git commit -m "Improve: Add Hebrew labels to all buttons and enhance article reading

- Added Hebrew text labels next to all buttons in header and footer
- Improved UI with better spacing and layout
- Enhanced article reading with multiple proxy fallbacks
- Better error messages in Hebrew
- Improved article content extraction for Ynet and other sites
- Split long articles into chunks for better reading
- Added dynamic button states and text updates
- Enhanced footer with button labels
- Improved header with subtitle
- Better article source display with improved read buttons"

Write-Host "`n4. Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "`n📋 GitHub Actions will deploy automatically..." -ForegroundColor Cyan
    Write-Host "`n⏳ Wait 1-2 minutes for deployment" -ForegroundColor Yellow
    Write-Host "`nCheck deployment: https://github.com/shaharprod/gemini-real-time-voice-chat/actions" -ForegroundColor White
    Write-Host "Site: https://shaharprod.github.io/gemini-real-time-voice-chat/" -ForegroundColor White
} else {
    Write-Host "`n❌ Push failed! Exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "`nTrying to check if there are uncommitted changes..." -ForegroundColor Yellow
    git status
    exit 1
}

