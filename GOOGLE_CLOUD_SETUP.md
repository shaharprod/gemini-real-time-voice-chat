# 🔧 הוראות להגדרת API Key ב-Google Cloud Console

## הבעיה: API Key לא עובד בגלל הגבלות

אם ה-API key לא עובד, יכול להיות שהגבלות ב-Google Cloud Console חוסמות אותו.

## ✅ פתרון מלא:

### שלב 1: כניסה ל-Google Cloud Console

1. לך ל-[Google Cloud Console](https://console.cloud.google.com/)
2. **התחבר** עם החשבון שלך
3. **בחר את הפרויקט** שלך (או צור פרויקט חדש)

### שלב 2: הפעל את Gemini API

1. בתפריט, לך ל-**APIs & Services** → **Library**
2. חפש: **"Generative Language API"** או **"Gemini API"**
3. לחץ עליו
4. לחץ על **"Enable"** (הפעל)

**חשוב**: אם לא הפעלת את ה-API, המפתח לא יעבוד!

### שלב 3: צור או מצא את ה-API Key

1. לך ל-**APIs & Services** → **Credentials**
2. אם אין לך API key:
   - לחץ על **"+ CREATE CREDENTIALS"**
   - בחר **"API key"**
   - לחץ **"Create"**
3. אם יש לך API key:
   - לחץ עליו כדי לערוך

### שלב 4: הגדר הגבלות (חשוב מאוד!)

1. **בחר את ה-API key** שלך (לחץ עליו)
2. תחת **"API restrictions"**:
   - בחר **"Restrict key"**
   - בחר **"Generative Language API"** או **"Gemini API"**
   - לחץ **"Save"**

3. תחת **"Application restrictions"**:

   **אופציה 1: HTTP referrers (מומלץ ל-GitHub Pages)**
   - בחר **"HTTP referrers (web sites)"**
   - לחץ **"Add an item"**
   - הוסף את הדומיין:
     ```
     https://shaharprod.github.io/*
     ```
   - אפשר גם להוסיף לוקאלי:
     ```
     http://localhost:*
     http://127.0.0.1:*
     ```
   - לחץ **"Save"**

   **אופציה 2: None (אם לא רוצה הגבלות)**
   - בחר **"None"**
   - זה יאפשר שימוש מכל מקום (פחות בטוח!)

### שלב 5: העתק את ה-API Key

1. **העתק** את המפתח (החלק שאתה רואה)
2. **שמור** אותו במקום בטוח
3. זה המפתח שתשתמש בו ב-GitHub Secrets

### שלב 6: הגדר Quotas (אופציונלי - מומלץ)

1. לך ל-**APIs & Services** → **Dashboard**
2. בחר את **"Generative Language API"**
3. לחץ על **"Quotas"**
4. כאן תוכל להגדיר:
   - כמה בקשות לדקה/שעה
   - הגבלות על שימוש

**זה עוזר להגביל את הנזק אם המפתח נגנב!**

---

## ⚠️ טיפים חשובים:

### 1. אם ה-API key לא עובד:

- **ודא שהפעלת את Gemini API** (שלב 2)
- **ודא שהגדרת API restrictions** (שלב 4)
- **ודא שהדומיין נכון** (אם משתמש ב-HTTP referrers)

### 2. איך לבדוק שזה עובד:

1. פתח את האתר: https://shaharprod.github.io/gemini-real-time-voice-chat/
2. פתח Console (F12)
3. לחץ על המיקרופון
4. אם יש שגיאה `API Error` או `403` = יכול להיות שההגבלות לא נכונות
5. אם אין שגיאות = זה עובד! ✅

### 3. שגיאות נפוצות:

**שגיאה: "API key not valid"**
- המפתח לא תקין או לא הוגדר נכון

**שגיאה: "API not enabled"**
- לא הפעלת את Gemini API (שלב 2)

**שגיאה: "403 Forbidden"**
- ההגבלות חוסמות את השימוש
- בדוק את ה-HTTP referrers (שלב 4)

**שגיאה: "429 Too Many Requests"**
- הגעת למגבלת quotas
- תוכל להגדיר quotas גבוהים יותר (שלב 6)

---

## 🔐 אבטחה:

### מומלץ:

1. **השתמש ב-HTTP referrers** - הגבל רק לדומיין שלך
2. **הגדר quotas נמוכים** - הגבל שימוש
3. **צור מפתח נפרד ל-GitHub Pages** - לא משתמש במפתח הראשי

### לא מומלץ:

1. **אל תשתמש ב-"None" בהגבלות** - זה מאפשר שימוש מכל מקום
2. **אל תפרסם את המפתח בקוד** - השתמש ב-Secrets

---

## 📝 סיכום מהיר:

1. ✅ הפעל Gemini API (APIs & Services → Library → Enable)
2. ✅ צור API key (APIs & Services → Credentials → Create)
3. ✅ הגדר API restrictions (בחר Gemini API)
4. ✅ הגדר Application restrictions (HTTP referrers → הוסף את הדומיין)
5. ✅ העתק את המפתח והשתמש בו ב-GitHub Secrets

אם עדיין יש בעיות, בדוק את ה-Console (F12) וחפש שגיאות!

