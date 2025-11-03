# 🚀 הוראות פריסה מהירות ל-GitHub Pages

## ✅ מצב נוכחי

האתר שלך זמין ב: **https://shaharprod.github.io/gemini-real-time-voice-chat**

## 📋 מה צריך לוודא:

### 1. GitHub Pages מוגדר ✅
- לך ל-**Settings** → **Pages** ב-GitHub
- ודא שה-Source מוגדר ל: **GitHub Actions**

### 2. API Key מוגדר ב-Secrets ✅
- לך ל-**Settings** → **Secrets and variables** → **Actions**
- ודא שיש Secret בשם: `GEMINI_API_KEY`
- אם לא, הוסף אותו עכשיו!

### 3. הגבלות על API Key (מומלץ) ⚠️
להגנה נוספת, הגדר הגבלות:
1. לך ל-[Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. בחר את המפתח שלך
4. **Application restrictions** → **HTTP referrers**
5. הוסף: `https://shaharprod.github.io/*`
6. **Save**

## 🔄 איך לעדכן את האתר

לאחר כל שינוי בקוד:

```bash
git add .
git commit -m "Update: [תיאור השינוי]"
git push origin main
```

GitHub Actions יפרוס אוטומטית!

## 🔍 לבדוק שהאתר עובד

1. פתח: https://shaharprod.github.io/gemini-real-time-voice-chat
2. לחץ על הכפתור המיקרופון
3. אשר גישה למיקרופון
4. דבר אל האפליקציה

## ⚠️ בעיות נפוצות

### האתר לא נטען?
- ודא ש-GitHub Actions עבר בהצלחה
- בדוק את ה-URL (חייב להיות בדיוק `/gemini-real-time-voice-chat/`)

### API Key לא עובד?
- ודא שה-Secret מוגדר ב-GitHub
- ודא שה-API key תקף
- בדוק את ה-console בדפדפן לשגיאות

### המיקרופון לא עובד?
- ודא שהדפדפן מאפשר גישה למיקרופון
- האתר חייב להיות ב-HTTPS (GitHub Pages מספק)

## 📞 עזרה

אם יש בעיות, בדוק:
1. GitHub Actions logs (Actions tab ב-GitHub)
2. Browser console (F12)
3. Network tab (F12) לבדיקת קריאות API

