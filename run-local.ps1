# Run application locally
Set-Location "c:\Users\User\Downloads\gemini-real-time-voice-chat (1)"

Write-Host "🚀 Starting local development server..." -ForegroundColor Cyan

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "`n⚠️  .env.local file not found!" -ForegroundColor Yellow
    Write-Host "Creating .env.local file..." -ForegroundColor Yellow
    Write-Host "`nPlease enter your Gemini API key:" -ForegroundColor Cyan
    $apiKey = Read-Host "API Key"
    
    if ($apiKey) {
        Set-Content -Path ".env.local" -Value "GEMINI_API_KEY=$apiKey"
        Write-Host "✅ .env.local file created!" -ForegroundColor Green
    } else {
        Write-Host "❌ No API key provided. Please create .env.local manually with:" -ForegroundColor Red
        Write-Host "   GEMINI_API_KEY=your_api_key_here" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✅ .env.local file found" -ForegroundColor Green
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed!" -ForegroundColor Green
}

Write-Host "`n🌐 Starting development server..." -ForegroundColor Yellow
Write-Host "The app will open at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start dev server
npm run dev

