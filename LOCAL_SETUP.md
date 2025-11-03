# 🚀 הפעלה לוקאלית - הוראות

## 📋 שלב 1: התקנת תלויות (רק בפעם הראשונה)

אם עדיין לא התקנת את התלויות, הרץ:

```powershell
npm install
```

## 🔑 שלב 2: הגדרת API Key

צור קובץ `.env.local` בתיקיית הפרויקט עם המפתח API שלך:

```
GEMINI_API_KEY=המפתח_שלך_כאן
```

**איפה לקבל API key:**
- לך ל: https://makersuite.google.com/app/apikey
- או: https://console.cloud.google.com/apis/credentials

## ▶️ שלב 3: הפעלת האפליקציה

**אפשרות א' - עם סקריפט:**
```powershell
.\run-local.ps1
```

**אפשרות ב' - ידנית:**
```powershell
npm run dev
```

האפליקציה תיפתח ב: **http://localhost:3000**

## ✅ בדיקות

1. פתח את הדפדפן ב-`http://localhost:3000`
2. אשר גישה למיקרופון (כאשר יתבקש)
3. לחץ על כפתור המיקרופון
4. דבר אל האפליקציה

## ⚠️ בעיות נפוצות

### "GEMINI_API_KEY is not set"
- ודא שקובץ `.env.local` קיים בתיקיית הפרויקט
- ודא שהקובץ מכיל: `GEMINI_API_KEY=המפתח_שלך`
- ודא שאין רווחים סביב ה-`=`

### המיקרופון לא עובד
- ודא שהדפדפן מאפשר גישה למיקרופון
- בדוק את ההגדרות: Settings → Privacy → Microphone

### שגיאת npm install
- ודא ש-Node.js מותקן: `node --version` (צריך 18+)
- נסה למחוק `node_modules` ולהריץ `npm install` מחדש

## 📞 עזרה

אם יש בעיות:
1. פתח Console בדפדפן (F12)
2. בדוק את השגיאות
3. ודא שה-API key תקף

