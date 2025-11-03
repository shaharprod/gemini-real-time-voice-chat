# 🔍 הפעלת חיפוש באינטרנט ב-Gemini

## הבעיה

החיפוש באינטרנט לא עובד - ה-AI אומר שהוא מחפש אבל התשובות לא מעודכנות.

## ✅ פתרון - הפעל Google Search Grounding ב-Google Cloud

### שלב 1: הפעל את Google Search Grounding API

1. לך ל-[Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Library**
3. חפש: **"Google Search Grounding API"** או **"Grounding API"**
4. לחץ עליו ולחץ **"Enable"**

**חשוב**: בלי להפעיל את ה-API הזה, החיפוש לא יעבוד!

### שלב 2: ודא שה-API Key כולל הרשאות

1. לך ל-**APIs & Services** → **Credentials**
2. בחר את ה-API key שלך
3. תחת **"API restrictions"**:
   - ודא שיש **"Generative Language API"** (Gemini API)
   - ודא שיש **"Google Search Grounding API"** (אם קיים)
4. שמור

### שלב 3: נסה שוב

לאחר הפעלת ה-API, נסה לשאול שאלה על חדשות עדכניות ובדוק אם התשובות מעודכנות.

---

## ⚠️ הערות חשובות:

### אם החיפוש עדיין לא עובד:

1. **ודא שהפעלת את Grounding API** (שלב 1)
2. **ודא שה-API key כולל הרשאות** (שלב 2)
3. **בדוק את ה-Console** (F12) - אולי יש שגיאה
4. **נסה שאלה ברורה** - "מה החדשות האחרונות על..."

### דוגמאות לשאלות שיפעילו חיפוש:

- "מה החדשות האחרונות בישראל?"
- "מה המחיר של... היום?"
- "מה המצב ב... עכשיו?"
- "מה קרה היום ב-..."

---

## 🔧 אם עדיין לא עובד:

יכול להיות ש-Gemini Live API לא תומך בחיפוש, או שצריך model אחר. בדוק:
1. אם יש שגיאה ב-Console
2. אם יש הודעת שגיאה מה-API
3. אם צריך לעבור ל-model אחר (לא preview)

---

## 📝 סיכום:

1. ✅ הפעל **Google Search Grounding API** ב-Google Cloud Console
2. ✅ ודא שה-API key כולל הרשאות
3. ✅ נסה שאלות על מידע עדכני
4. ✅ בדוק שהתשובות מעודכנות

אם עדיין לא עובד, שלח את השגיאה מה-Console!

