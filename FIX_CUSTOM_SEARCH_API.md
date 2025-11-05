# 🔧 תיקון שגיאת Custom Search API (401)

## הבעיה:
```
API keys are not supported by this API. Expected OAuth2 access token
```

זה אומר שה-API Key שלך לא מתאים ל-Custom Search API.

## ✅ פתרון שלב אחר שלב:

### שלב 1: ודא שהפעלת את Custom Search API

1. לך ל-[Google Cloud Console](https://console.cloud.google.com/)
2. בחר את הפרויקט שלך
3. לך ל-**APIs & Services** → **Library**
4. חפש **"Custom Search API"** (לא "Google Search API" או "Search Console API")
5. לחץ עליו
6. לחץ **"Enable"** (הפעל)

**חשוב**: אם לא הפעלת את ה-API, המפתח לא יעבוד!

### שלב 2: צור API Key חדש עבור Custom Search

1. לך ל-**APIs & Services** → **Credentials**
2. לחץ **"+ CREATE CREDENTIALS"** → **"API key"**
3. העתק את ה-API key שזה עתה נוצר
4. לחץ על ה-API key כדי לערוך אותו:
   - תחת **"API restrictions"** → בחר **"Restrict key"**
   - בחר רק **"Custom Search API"** (לא Gemini API!)
   - לחץ **"Save"**

**⚠️ חשוב**: 
- זה צריך להיות API Key **נפרד** מהמפתח של Gemini
- המפתח צריך להיות מוגבל רק ל-**Custom Search API**

### שלב 3: עדכן את `.env.local`

פתח את הקובץ `.env.local` ועדכן:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_CUSTOM_SEARCH_API_KEY=your_NEW_custom_search_api_key_here
GOOGLE_CUSTOM_SEARCH_CX=83f6b2cb223604c2f
```

**החלף:**
- `your_gemini_api_key_here` - המפתח הקיים שלך ל-Gemini (לא משתנה)
- `your_NEW_custom_search_api_key_here` - המפתח החדש שיצרת בשלב 2

### שלב 4: הפעל מחדש את השרת

1. עצור את השרת (Ctrl+C)
2. הפעל מחדש:
   ```bash
   npm run dev
   ```

### שלב 5: בדוק שהכל עובד

1. פתח את האפליקציה בדפדפן
2. פתח את ה-Console (F12)
3. נסה לבקש חיפוש (למשל: "כותרות של ynet")
4. בדוק את ה-Console - לא אמורה להיות שגיאת 401

## 🔍 איך לבדוק שהמפתח נכון:

בקונסול תראה:
```
🔍 API Key present: true CX present: true
⏱️ API response time: XXXms, status: 200
✅ Custom Search API found X results
```

אם אתה רואה:
```
❌ Custom Search API error: 401
```

זה אומר שהמפתח לא נכון או שה-API לא מופעל.

## ⚠️ שגיאות נפוצות:

### שגיאה 1: "API keys are not supported"
- **סיבה**: המפתח לא מוגבל ל-Custom Search API, או שלא הפעלת את ה-API
- **פתרון**: חזור לשלב 1 ו-2

### שגיאה 2: "Invalid API key"
- **סיבה**: המפתח לא נכון או לא הועתק נכון
- **פתרון**: בדוק את `.env.local` - ודא שהמפתח נכון

### שגיאה 3: "Quota exceeded"
- **סיבה**: הגעת למגבלת החיפושים (100 חינם ביום)
- **פתרון**: חכה 24 שעות או שדרג את התוכנית

## 📞 אם עדיין לא עובד:

1. ודא שהמפתח מתחיל ב-`AIzaSy...` (זה API Key של Google)
2. ודא שה-CX נכון: `83f6b2cb223604c2f`
3. בדוק את ה-Console (F12) לכל שגיאות
4. ודא שהקובץ `.env.local` נמצא בשורש הפרויקט

## 🔑 איפה לקבל את המפתחות:

- **GEMINI_API_KEY**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- **GOOGLE_CUSTOM_SEARCH_API_KEY**: [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create API Key
- **GOOGLE_CUSTOM_SEARCH_CX**: `83f6b2cb223604c2f` (כבר יש לך ✅)

