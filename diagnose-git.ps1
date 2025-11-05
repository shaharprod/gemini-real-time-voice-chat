# אבחון בעיות git
Write-Host "🔍 מאבחן בעיות git..." -ForegroundColor Cyan

Write-Host "`n📋 Git Status:" -ForegroundColor Yellow
git status 2>&1

Write-Host "`n🌐 Git Remote:" -ForegroundColor Yellow
$remote = git remote -v 2>&1
if ($remote -match "origin") {
    Write-Host $remote -ForegroundColor Green
} else {
    Write-Host "❌ אין git remote מוגדר!" -ForegroundColor Red
    Write-Host "`nכדי להוסיף remote, הרץ:" -ForegroundColor Yellow
    Write-Host "git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git" -ForegroundColor White
}

Write-Host "`n📝 Git Config:" -ForegroundColor Yellow
$userName = git config user.name 2>&1
$userEmail = git config user.email 2>&1
if ($userName -and $userEmail) {
    Write-Host "User: $userName" -ForegroundColor Green
    Write-Host "Email: $userEmail" -ForegroundColor Green
} else {
    Write-Host "⚠️ אין user.name או user.email מוגדרים!" -ForegroundColor Yellow
    Write-Host "`nכדי להגדיר, הרץ:" -ForegroundColor Yellow
    Write-Host "git config user.name 'Your Name'" -ForegroundColor White
    Write-Host "git config user.email 'your.email@example.com'" -ForegroundColor White
}

Write-Host "`n🌿 Branch נוכחי:" -ForegroundColor Yellow
$branch = git branch --show-current 2>&1
if ($branch) {
    Write-Host $branch -ForegroundColor Green
} else {
    Write-Host "⚠️ לא נמצא branch נוכחי" -ForegroundColor Yellow
}

Write-Host "`n📦 שינויים שלא נשלחו:" -ForegroundColor Yellow
$uncommitted = git status --porcelain 2>&1
if ($uncommitted) {
    Write-Host "יש שינויים שלא נשלחו:" -ForegroundColor Yellow
    Write-Host $uncommitted -ForegroundColor White
} else {
    Write-Host "אין שינויים חדשים" -ForegroundColor Green
}

Write-Host "`n📤 קומיטים שלא נדחפו:" -ForegroundColor Yellow
$unpushed = git log origin/$branch..HEAD 2>&1
if ($unpushed -and !$unpushed.Contains("fatal")) {
    Write-Host "יש קומיטים שלא נדחפו:" -ForegroundColor Yellow
    git log origin/$branch..HEAD --oneline 2>&1 | Select-Object -First 5
} else {
    Write-Host "אין קומיטים שלא נדחפו או אין remote branch" -ForegroundColor Green
}

Write-Host "`n✅ סיכום:" -ForegroundColor Cyan
Write-Host "אם יש בעיות, השתמש בסקריפט commit-push-now.ps1 או הרץ ידנית:" -ForegroundColor Yellow
Write-Host "git add -A" -ForegroundColor White
Write-Host "git commit -m 'הודעה'" -ForegroundColor White
Write-Host "git push origin main" -ForegroundColor White

