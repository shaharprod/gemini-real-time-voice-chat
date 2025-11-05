# קומיט ופוש לשינויים
Write-Host "🔄 בודק שינויים..." -ForegroundColor Cyan
git status

# בדוק אם יש remote
$remote = git remote -v 2>&1
if ($LASTEXITCODE -ne 0 -or !$remote) {
    Write-Host "`n❌ אין git remote מוגדר!" -ForegroundColor Red
    Write-Host "`nכדי להוסיף git remote, הרץ:" -ForegroundColor Yellow
    Write-Host "git remote add origin https://github.com/your-username/your-repo.git" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n🌐 Git Remote:" -ForegroundColor Cyan
git remote -v

# בדוק איזה branch אנחנו עליו
$branch = git branch --show-current
if (!$branch) {
    $branch = "main"
}

Write-Host "`n📋 Branch נוכחי: $branch" -ForegroundColor Cyan

Write-Host "`n📦 מוסיף שינויים..." -ForegroundColor Cyan
git add -A

# בדוק אם יש שינויים
$status = git status --porcelain
if (!$status) {
    Write-Host "⚠️ אין שינויים חדשים לקומיט" -ForegroundColor Yellow
    exit 0
}

Write-Host "`n💾 מבצע קומיט..." -ForegroundColor Cyan
git commit -m "שיפור מנגנון החיפוש ותיקון תמלול - איסור קריאת לינקים בקול"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ קומיט בוצע בהצלחה!" -ForegroundColor Green
} else {
    Write-Host "⚠️ שגיאה בקומיט או אין שינויים חדשים" -ForegroundColor Yellow
    exit
}

Write-Host "`n🚀 דוחף לגיטהב..." -ForegroundColor Cyan

# נסה לדחוף עם branch name
git push -u origin $branch

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ פוש בוצע בהצלחה!" -ForegroundColor Green
} else {
    Write-Host "`n❌ שגיאה בפוש!" -ForegroundColor Red
    Write-Host "`nנסה אחד מהפתרונות הבאים:" -ForegroundColor Yellow

    Write-Host "`n1. בדוק את ה-git remote:" -ForegroundColor Cyan
    Write-Host "   git remote -v" -ForegroundColor White

    Write-Host "`n2. נסה לדחוף ידנית:" -ForegroundColor Cyan
    Write-Host "   git push origin $branch" -ForegroundColor White

    Write-Host "`n3. אם יש בעיה עם האימות:" -ForegroundColor Cyan
    Write-Host "   - ודא שיש לך Personal Access Token מוגדר" -ForegroundColor White
    Write-Host "   - או הגדר SSH key" -ForegroundColor White

    Write-Host "`n4. אם ה-branch לא קיים ב-remote:" -ForegroundColor Cyan
    Write-Host "   git push -u origin $branch" -ForegroundColor White

    exit 1
}

