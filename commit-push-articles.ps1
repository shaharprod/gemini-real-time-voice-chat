# Commit and push article reading features
Set-Location "c:\Users\User\Downloads\gemini-real-time-voice-chat (1)"

Write-Host "🚀 Committing and pushing article reading features..." -ForegroundColor Cyan

Write-Host "`n1. Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host "`n2. Committing..." -ForegroundColor Yellow
git commit -m "Add: Article titles and full article reading from search results

- Added automatic URL extraction from AI responses
- Added readArticleTitles() to read all article titles aloud
- Added readFullArticle() to read full article content from URL
- Added article sources display panel with individual read buttons
- Added NewsIcon component
- Updated system instruction to include URLs in responses
- Enhanced search functionality with article reading capabilities
- Uses CORS proxy for fetching article content"

Write-Host "`n3. Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "`n📋 GitHub Actions will deploy automatically..." -ForegroundColor Cyan
    Write-Host "`n⏳ Wait 1-2 minutes for deployment" -ForegroundColor Yellow
    Write-Host "`nCheck: https://github.com/shaharprod/gemini-real-time-voice-chat/actions" -ForegroundColor White
    Write-Host "Site: https://shaharprod.github.io/gemini-real-time-voice-chat/" -ForegroundColor White
} else {
    Write-Host "`n❌ Push failed! Exit code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

