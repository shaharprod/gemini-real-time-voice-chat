# בדיקת הגדרות git
Write-Host "🔍 בודק הגדרות git..." -ForegroundColor Cyan

Write-Host "`n📋 Git Status:" -ForegroundColor Yellow
git status

Write-Host "`n🌐 Git Remote:" -ForegroundColor Yellow
git remote -v

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n⚠️ אין git remote מוגדר!" -ForegroundColor Red
    Write-Host "`nכדי להוסיף git remote, הרץ:" -ForegroundColor Yellow
    Write-Host "git remote add origin <URL של ה-repository שלך>" -ForegroundColor Yellow
    Write-Host "`nאו אם יש לך כבר remote:" -ForegroundColor Yellow
    Write-Host "git remote set-url origin <URL של ה-repository שלך>" -ForegroundColor Yellow
    exit
}

Write-Host "`n📝 Git Config:" -ForegroundColor Yellow
git config user.name
git config user.email

Write-Host "`n✅ אם יש שגיאות, ודא ש:" -ForegroundColor Green
Write-Host "1. יש לך git remote מוגדר (git remote -v)" -ForegroundColor Cyan
Write-Host "2. יש לך git user.name ו-user.email מוגדרים" -ForegroundColor Cyan
Write-Host "3. יש לך הרשאות לדחוף ל-repository" -ForegroundColor Cyan

