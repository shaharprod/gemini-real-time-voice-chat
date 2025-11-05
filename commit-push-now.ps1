# קומיט ופוש לשינויים
Write-Host "🔄 בודק שינויים..." -ForegroundColor Cyan
git status

Write-Host "`n📦 מוסיף שינויים..." -ForegroundColor Cyan
git add -A

Write-Host "`n💾 מבצע קומיט..." -ForegroundColor Cyan
git commit -m "שיפור מנגנון החיפוש ותיקון תמלול - איסור קריאת לינקים בקול"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ קומיט בוצע בהצלחה!" -ForegroundColor Green
} else {
    Write-Host "⚠️ אין שינויים חדשים או שגיאה בקומיט" -ForegroundColor Yellow
    exit
}

Write-Host "`n🚀 דוחף לגיטהב..." -ForegroundColor Cyan
git push

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ פוש בוצע בהצלחה!" -ForegroundColor Green
} else {
    Write-Host "`n❌ שגיאה בפוש - בדוק את ה-git remote והאימות" -ForegroundColor Red
    Write-Host "`nנסה להריץ ידנית:" -ForegroundColor Yellow
    Write-Host "git remote -v" -ForegroundColor Yellow
    Write-Host "git push" -ForegroundColor Yellow
}

