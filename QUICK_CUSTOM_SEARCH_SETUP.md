# ⚡ הגדרה מהירה ל-Custom Search API

## ✅ מה כבר יש לך:

- **CX (Search Engine ID)**: `83f6b2cb223604c2f` ✅

## 🔑 מה אתה צריך לעשות עכשיו:

### שלב 1: קבל API Key

1. לך ל-[Google Cloud Console](https://console.cloud.google.com/)
2. בחר את הפרויקט שלך (או צור פרויקט חדש)
3. לך ל-**APIs & Services** → **Library**
4. חפש **"Custom Search API"**
5. לחץ עליו ולחץ **"Enable"**
6. לך ל-**APIs & Services** → **Credentials**
7. לחץ **"+ CREATE CREDENTIALS"** → **"API key"**
8. **העתק את ה-API key** (נראה כמו: `AIzaSyAbc123...`)
9. **חשוב**: לחץ על ה-API key כדי לערוך אותו:
   - תחת **"API restrictions"** → בחר **"Restrict key"**
   - בחר רק **"Custom Search API"**
   - לחץ **"Save"**

### שלב 2: הוסף ל-`.env.local`

צור קובץ `.env.local` בשורש הפרויקט (אם לא קיים) והוסף:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_CUSTOM_SEARCH_API_KEY=your_custom_search_api_key_here
GOOGLE_CUSTOM_SEARCH_CX=83f6b2cb223604c2f
```

**החלף:**
- `your_gemini_api_key_here` - המפתח הקיים שלך ל-Gemini
- `your_custom_search_api_key_here` - המפתח החדש שקיבלת משלב 1

### שלב 3: נסה שוב

1. הפעל מחדש את השרת (`npm run dev`)
2. הכפתור **"Custom Search"** באפליקציה אמור לעבוד

## ⚠️ הערות חשובות:

- **מחירים**: 100 חיפושים חינם ביום, ואז 5$ לכל 1000 חיפושים
- **אבטחה**: ה-API Key יהיה גלוי ב-frontend, אז הגבל אותו רק ל-Custom Search API
- **הבדל**: הקוד שהתקבל (`<script async src="...">`) הוא ל-embed באתר, אבל אנחנו משתמשים ב-API ישירות

## 🔧 אם לא עובד:

1. ודא שהפעלת את **Custom Search API** ב-Google Cloud Console
2. ודא שה-API key מוגבל רק ל-**Custom Search API**
3. ודא שה-CX נכון: `83f6b2cb223604c2f`
4. בדוק את ה-Console (F12) לשגיאות

