# Simple commit and push
Set-Location "c:\Users\User\Downloads\gemini-real-time-voice-chat (1)"

git add .
git commit -m "Fix: Ensure API key is properly passed (support both GEMINI_API_KEY and API_KEY)"
git push origin main

Write-Host "`n✅ Done! Deployment will start automatically." -ForegroundColor Green
Write-Host "Check: https://github.com/shaharprod/gemini-real-time-voice-chat/actions" -ForegroundColor Cyan

