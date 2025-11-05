# ⚡ תיקון מהיר - הגדרת API Key

## מה אני רואה במסך שלך:

אתה נמצא בעמוד "Edit API key" של Google Cloud Console. המפתח שלך **לא מוגבל** - וזה הבעיה!

## ✅ מה לעשות (צעד אחר צעד):

### שלב 1: הגדר API restrictions

1. **גלול למטה** עד שתראה את הסעיף **"API restrictions"**
2. **בחר את הרדיו בוטון** **"Restrict key"** (במקום "Don't restrict key")
3. **תופיע רשימה** של APIs - חפש **"Custom Search API"**
4. **סמן את התיבה** ליד **"Custom Search API"**
5. **הסר את כל הסימונים האחרים** (אם יש)

### שלב 2: שמור

1. **גלול למטה** עד שתראה את כפתור **"Save"**
2. **לחץ על "Save"**

### שלב 3: העתק את המפתח

1. **בצד ימין** תראה את הכפתור **"Show key"**
2. **לחץ עליו** כדי לראות את המפתח
3. **העתק את המפתח** (נראה כמו: `AIzaSyAbc123...`)

### שלב 4: עדכן את `.env.local`

1. פתח את הקובץ `.env.local` בשורש הפרויקט
2. עדכן את השורה:
   ```env
   GOOGLE_CUSTOM_SEARCH_API_KEY=המפתח_שלך_כאן
   ```
3. **החלף** `המפתח_שלך_כאן` במפתח שהעתקת

### שלב 5: הפעל מחדש

1. עצור את השרת (Ctrl+C)
2. הפעל מחדש:
   ```bash
   npm run dev
   ```

## ✅ איך לבדוק שהכל עובד:

1. פתח את האפליקציה בדפדפן
2. פתח את ה-Console (F12)
3. נסה לבקש חיפוש (למשל: "כותרות של ynet")
4. בקונסול תראה:
   - ✅ `✅ Custom Search API found X results` - הכל עובד!
   - ❌ `❌ Custom Search API error: 401` - עדיין יש בעיה

## ⚠️ חשוב:

- **המפתח צריך להיות מוגבל רק ל-Custom Search API**
- **לא** Gemini API
- **לא** "Don't restrict key"

## 📸 התמונה שאני רואה:

- Name: "c search" ✅ (טוב)
- API restrictions: "Don't restrict key" ❌ (זה הבעיה!)
- צריך לשנות ל: **"Restrict key"** → **"Custom Search API"** ✅

## 🔧 אם אתה לא רואה "Custom Search API" ברשימה:

1. **ודא שהפעלת את ה-API**:
   - לך ל-**APIs & Services** → **Library**
   - חפש **"Custom Search API"**
   - לחץ עליו ולחץ **"Enable"**
   - חזור ל-**Credentials** → **Edit API key**

2. **אם עדיין לא רואה**:
   - נסה לרענן את הדף
   - או צור API Key חדש

## 📋 סיכום מהיר:

1. ✅ בחר "Restrict key" תחת "API restrictions"
2. ✅ סמן רק "Custom Search API"
3. ✅ לחץ "Save"
4. ✅ העתק את המפתח
5. ✅ עדכן את `.env.local`
6. ✅ הפעל מחדש את השרת

עכשיו זה אמור לעבוד! 🎉

