# 📝 הוראות להגדרת .env.local

## מה צריך לעשות:

### אופציה 1: יצירה ידנית (פשוט)

1. צור קובץ חדש בשם `.env.local` בשורש הפרויקט
2. הוסף את התוכן הבא:

```env
GEMINI_API_KEY=המפתח_שלך_כאן
GOOGLE_CUSTOM_SEARCH_API_KEY=המפתח_שלך_כאן
GOOGLE_CUSTOM_SEARCH_CX=83f6b2cb223604c2f
```

**החלף:**
- `המפתח_שלך_כאן` במקום הראשון - המפתח שלך ל-Gemini API
- `המפתח_שלך_כאן` במקום השני - המפתח שלך ל-Google Custom Search API (אם יש לך)

**אם אין לך Custom Search API Key עדיין:**
- השאר רק את `GEMINI_API_KEY` ו-`GOOGLE_CUSTOM_SEARCH_CX`
- תוכל להוסיף את `GOOGLE_CUSTOM_SEARCH_API_KEY` מאוחר יותר

### אופציה 2: שימוש בסקריפט

הרץ:
```powershell
.\create-env-local.ps1
```

הסקריפט יבקש ממך את המפתחות ויצור את הקובץ אוטומטית.

## ✅ איך לבדוק שהכל עובד:

1. הפעל מחדש את השרת:
   ```bash
   npm run dev
   ```

2. פתח את האפליקציה בדפדפן

3. בדוק את ה-Console (F12) - לא אמורות להיות שגיאות על משתני סביבה

## ⚠️ חשוב:

- הקובץ `.env.local` כבר ב-`.gitignore` - הוא לא יישלח ל-GitHub
- אל תשתף את המפתחות שלך עם אחרים
- אם אתה משתמש ב-GitHub Pages, הוסף את המפתחות כ-Secrets (ראה [GOOGLE_CUSTOM_SEARCH_SETUP.md](./GOOGLE_CUSTOM_SEARCH_SETUP.md))

## 🔑 איפה לקבל את המפתחות:

- **GEMINI_API_KEY**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- **GOOGLE_CUSTOM_SEARCH_API_KEY**: [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create API Key
- **GOOGLE_CUSTOM_SEARCH_CX**: `83f6b2cb223604c2f` (כבר יש לך ✅)

