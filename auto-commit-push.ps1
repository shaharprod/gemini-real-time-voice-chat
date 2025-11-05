# קומיט ופוש אוטומטי
$ErrorActionPreference = "Stop"

Write-Host "🚀 מתחיל קומיט ופוש אוטומטי..." -ForegroundColor Cyan
Write-Host ""

# בדוק אם יש remote ותקן אם צריך
try {
    $remote = git remote -v 2>&1 | Out-String
    $correctUrl = "https://github.com/shaharprod/gemini-real-time-voice-chat.git"
    
    if ($remote -match "origin") {
        if ($remote -notmatch "shaharprod/gemini-real-time-voice-chat") {
            Write-Host "⚠️ Remote מכוון ל-URL לא נכון, מתקן..." -ForegroundColor Yellow
            git remote remove origin 2>&1 | Out-Null
            git remote add origin $correctUrl
            Write-Host "✅ Remote תוקן!" -ForegroundColor Green
        } else {
            Write-Host "✅ Git remote נמצא:" -ForegroundColor Green
            git remote -v
        }
    } else {
        Write-Host "❌ אין git remote מוגדר, מוסיף..." -ForegroundColor Yellow
        git remote add origin $correctUrl
        Write-Host "✅ Remote נוסף!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ שגיאה בבדיקת remote: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# בדוק branch נוכחי
try {
    $branch = git branch --show-current 2>&1
    if (!$branch) {
        $branch = "main"
    }
    Write-Host "📋 Branch נוכחי: $branch" -ForegroundColor Cyan
} catch {
    Write-Host "⚠️ לא ניתן לזהות branch, משתמש ב-main" -ForegroundColor Yellow
    $branch = "main"
}

Write-Host ""

# הוסף שינויים
Write-Host "📦 מוסיף שינויים..." -ForegroundColor Cyan
try {
    git add -A
    Write-Host "✅ שינויים נוספו" -ForegroundColor Green
} catch {
    Write-Host "❌ שגיאה בהוספת שינויים: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# בדוק אם יש שינויים
$status = git status --porcelain 2>&1
if (!$status) {
    Write-Host "⚠️ אין שינויים חדשים לקומיט" -ForegroundColor Yellow
    exit 0
}

# קומיט
Write-Host "💾 מבצע קומיט..." -ForegroundColor Cyan
try {
    git commit -m "שיפור מנגנון החיפוש ותיקון תמלול - איסור קריאת לינקים בקול"
    Write-Host "✅ קומיט בוצע בהצלחה!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ שגיאה בקומיט או אין שינויים חדשים: $_" -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# פוש
Write-Host "🚀 דוחף לגיטהב..." -ForegroundColor Cyan
try {
    git push -u origin $branch
    Write-Host ""
    Write-Host "✅✅✅ פוש בוצע בהצלחה!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "❌ שגיאה בפוש!" -ForegroundColor Red
    Write-Host ""
    Write-Host "נסה אחד מהפתרונות הבאים:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. בדוק את ה-git remote:" -ForegroundColor Cyan
    Write-Host "   git remote -v" -ForegroundColor White
    Write-Host ""
    Write-Host "2. נסה לדחוף ידנית:" -ForegroundColor Cyan
    Write-Host "   git push origin $branch" -ForegroundColor White
    Write-Host ""
    Write-Host "3. אם יש בעיה עם האימות:" -ForegroundColor Cyan
    Write-Host "   - ודא שיש לך Personal Access Token מוגדר ב-GitHub" -ForegroundColor White
    Write-Host "   - או הגדר SSH key" -ForegroundColor White
    Write-Host ""
    exit 1
}

