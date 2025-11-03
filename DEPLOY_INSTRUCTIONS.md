# הוראות פריסה ל-GitHub Pages

## שלב 1: אתחול Git (אם עדיין לא)

```powershell
# אתחל repository
git init

# הוסף את כל הקבצים
git add .

# צור commit ראשון
git commit -m "Initial commit: Gemini Real-Time Voice Chat"

# הגדר את ה-remote (החלף את shaharprod אם זה לא שם המשתמש שלך)
git remote add origin https://github.com/shaharprod/gemini-real-time-voice-chat.git

# העלה את הקוד ל-main branch
git branch -M main
git push -u origin main
```

## שלב 2: הגדר GitHub Pages

1. לך ל-GitHub repository שלך
2. לך ל-**Settings** → **Pages**
3. תחת **Source**, בחר: **Deploy from a branch**
4. בחר **branch**: `gh-pages`
5. בחר **folder**: `/ (root)`
6. לחץ **Save**

## שלב 3: הגדר Secret ל-API Key (אם משתמש ב-GitHub Actions)

1. לך ל-**Settings** → **Secrets and variables** → **Actions**
2. לחץ **New repository secret**
3. שם: `GEMINI_API_KEY`
4. Value: המפתח API שלך
5. לחץ **Add secret**

## שלב 4: פרוס

לאחר שכל זה מוגדר, תוכל לפרוס:

```powershell
npm run deploy
```

או אם משתמש ב-GitHub Actions, פשוט תעשה push ל-main branch והפריסה תתבצע אוטומטית!

