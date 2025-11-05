# תיקון git remote ופוש
$ErrorActionPreference = "Stop"

Write-Host "🔧 מתקן git remote ומבצע קומיט ופוש..." -ForegroundColor Cyan

# ה-URL הנכון של ה-repository
$correctUrl = "https://github.com/shaharprod/gemini-real-time-voice-chat.git"

# בדוק את ה-remote הנוכחי
Write-Host "`n📋 Remote נוכחי:" -ForegroundColor Yellow
git remote -v

# הסר את ה-remote הישן אם יש
Write-Host "`n🗑️ מסיר remote ישן..." -ForegroundColor Cyan
git remote remove origin 2>&1 | Out-Null

# הוסף את ה-remote הנכון
Write-Host "✅ מוסיף remote נכון: $correctUrl" -ForegroundColor Green
git remote add origin $correctUrl

# בדוק שהתיקון הצליח
Write-Host "`n📋 Remote חדש:" -ForegroundColor Yellow
git remote -v

# בדוק branch נוכחי
$branch = git branch --show-current 2>&1
if (!$branch) {
    $branch = "main"
}
Write-Host "`n📋 Branch נוכחי: $branch" -ForegroundColor Cyan

# הוסף שינויים
Write-Host "`n📦 מוסיף שינויים..." -ForegroundColor Cyan
git add -A

# בדוק אם יש שינויים
$status = git status --porcelain 2>&1
if (!$status) {
    Write-Host "⚠️ אין שינויים חדשים לקומיט" -ForegroundColor Yellow
    exit 0
}

# קומיט
Write-Host "`n💾 מבצע קומיט..." -ForegroundColor Cyan
git commit -m "שיפור מנגנון החיפוש ותיקון תמלול - איסור קריאת לינקים בקול ושיפור זיהוי לינקים"

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ שגיאה בקומיט או אין שינויים חדשים" -ForegroundColor Yellow
    exit 0
}

Write-Host "✅ קומיט בוצע בהצלחה!" -ForegroundColor Green

# פוש
Write-Host "`n🚀 דוחף לגיטהב..." -ForegroundColor Cyan
git push -u origin $branch

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅✅✅ פוש בוצע בהצלחה!" -ForegroundColor Green
    Write-Host "`n🌐 Repository: https://github.com/shaharprod/gemini-real-time-voice-chat" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ שגיאה בפוש!" -ForegroundColor Red
    Write-Host "`nנסה אחד מהפתרונות הבאים:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. אם יש בעיה עם האימות:" -ForegroundColor Cyan
    Write-Host "   - ודא שיש לך Personal Access Token מוגדר ב-GitHub" -ForegroundColor White
    Write-Host "   - או הגדר SSH key" -ForegroundColor White
    Write-Host ""
    Write-Host "2. נסה לדחוף ידנית:" -ForegroundColor Cyan
    Write-Host "   git push -u origin $branch" -ForegroundColor White
    Write-Host ""
    exit 1
}

