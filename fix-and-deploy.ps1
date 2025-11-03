# Fix and deploy all changes to GitHub
Set-Location "c:\Users\User\Downloads\gemini-real-time-voice-chat (1)"

Write-Host "🔧 Fixing and deploying all changes..." -ForegroundColor Cyan

Write-Host "`n1. Checking git status..." -ForegroundColor Yellow
git status --short

Write-Host "`n2. Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host "`n3. Committing all improvements..." -ForegroundColor Yellow
git commit -m "Fix: Ensure all UI improvements and article reading features are deployed

- Added Hebrew labels to all buttons (header and footer)
- Enhanced article reading with multiple proxy fallbacks
- Improved UI layout and spacing
- Better error messages in Hebrew
- Improved article content extraction
- Split long articles into chunks
- Dynamic button states
- All changes ready for GitHub Pages deployment"

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

