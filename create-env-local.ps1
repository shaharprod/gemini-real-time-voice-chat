# Script to create or update .env.local file

$envFile = ".env.local"

# Check if file exists
if (Test-Path $envFile) {
    Write-Host "קובץ .env.local כבר קיים. האם אתה רוצה לעדכן אותו? (Y/N)"
    $response = Read-Host
    if ($response -ne "Y" -and $response -ne "y") {
        Write-Host "בוטל."
        exit
    }

    # Read existing content
    $existing = Get-Content $envFile -Raw
    Write-Host "`nהתוכן הנוכחי:"
    Write-Host $existing
    Write-Host "`n"
}

# Get Gemini API Key
Write-Host "הזן את ה-GEMINI_API_KEY שלך (או Enter לדילוג אם כבר קיים):"
$geminiKey = Read-Host

# Get Custom Search API Key
Write-Host "`nהזן את ה-GOOGLE_CUSTOM_SEARCH_API_KEY שלך (או Enter לדילוג):"
$customSearchKey = Read-Host

# CX is already known
$cx = "83f6b2cb223604c2f"

# Build content
$content = @()
if ($geminiKey) {
    $content += "GEMINI_API_KEY=$geminiKey"
}
if ($customSearchKey) {
    $content += "GOOGLE_CUSTOM_SEARCH_API_KEY=$customSearchKey"
}
$content += "GOOGLE_CUSTOM_SEARCH_CX=$cx"

# Write to file
$content | Out-File -FilePath $envFile -Encoding utf8

Write-Host "`n✅ קובץ .env.local נוצר/עודכן בהצלחה!"
Write-Host "`nהתוכן:"
Get-Content $envFile | ForEach-Object { Write-Host "  $_" }

Write-Host "`n⚠️ חשוב: ודא שהקובץ לא נשלח ל-Git (הוא כבר ב-.gitignore)"

