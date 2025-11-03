# ⚠️ אזהרת אבטחה חשובה

## הבעיה

באפליקציות client-side (כמו React), המפתח API מוטמע בקוד ה-JavaScript שנשלח לדפדפן. **זה אומר שכל מי שיפתח את האתר יכול לראות את המפתח שלך בקוד המקור!**

## המצב הנוכחי

1. ✅ קובץ `.env.local` לא יעלה ל-GitHub (בטוח)
2. ⚠️ אם תריץ `npm run deploy` מקומית, המפתח יעלה ל-GitHub Pages ויהיה גלוי
3. ⚠️ אם תשתמש ב-GitHub Actions, המפתח יוטמע ב-build, אבל עדיין יהיה גלוי בדפדפן

## פתרונות בטוחים

### אפשרות 1: הגבלת הרשאות ב-API Key (מומלץ)

1. לך ל-Google Cloud Console
2. הגדר IP/Domain restrictions על המפתח
3. הגדר quotas ומגבלות שימוש
4. כך גם אם המפתח נגנב, הנזק מוגבל

### אפשרות 2: Backend Proxy (הכי בטוח - אבל מורכב)

צור backend server (Node.js/Express) שיחזיק את המפתח ויעשה proxy ל-API:
- המפתח יהיה רק ב-backend (לא נגיש ל-client)
- ה-client יקרא ל-backend שלך
- ה-backend יקרא ל-Gemini API

**⚠️ אתגר עם Gemini Live API:**
האפליקציה הזו משתמשת ב-**Gemini Live API** שזה **WebSocket streaming** - לא REST API רגיל. זה מקשה על יצירת proxy כי צריך:
1. WebSocket connection בין client ל-backend
2. WebSocket connection בין backend ל-Gemini API
3. Proxy/relay של המידע בזמן אמת בין השניים

**זה דורש שינויים גם ב-client code!** ראה `backend/README.md` להדרכה.

**לפרויקטים דמואים - מומלץ להשתמש בפתרון 1 (הגבלות על API key) במקום.**

### אפשרות 3: שימוש ב-API key עם הגבלות

1. צור API key נפרד ל-GitHub Pages
2. הגדר לו quotas נמוכים
3. אם הוא נגנב, הנזק מוגבל

## המלצה

**לפרויקטים פרטיים/דמואים**: אפשר להשתמש ב-API key עם הגבלות
**לפרויקטים ייצוריים**: השתמש ב-backend proxy!

## איך להגדיר IP/Domain restrictions

ראה הוראות מפורטות ב-[GOOGLE_CLOUD_SETUP.md](GOOGLE_CLOUD_SETUP.md)

**סיכום מהיר:**
1. לך ל-Google Cloud Console → APIs & Services → Credentials
2. בחר את המפתח שלך
3. תחת "Application restrictions" בחר "HTTP referrers"
4. הוסף את הדומיין: `https://shaharprod.github.io/*`
5. תחת "API restrictions" בחר "Restrict key" ובחר "Generative Language API"
6. שמור

זה יגביל את השימוש במפתח רק לדומיין שלך!

