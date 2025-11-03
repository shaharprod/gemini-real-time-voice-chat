# הוסף את package-lock.json ל-git
Write-Host "Adding package-lock.json to git..." -ForegroundColor Yellow

# הסר את package-lock.json מ-.gitignore (אם עדיין שם)
# זה כבר נעשה בקובץ .gitignore

# הוסף את package-lock.json
git add package-lock.json

# Commit
git commit -m "Add package-lock.json for GitHub Actions"

# Push
git push origin main --force

Write-Host "`n✅ Done! package-lock.json added and pushed." -ForegroundColor Green
Write-Host "GitHub Actions should now work!" -ForegroundColor Cyan

