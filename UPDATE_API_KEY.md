# 🔑 איך לעדכן את ה-API Key ב-GitHub

אם שינית את ה-API key ב-Google Cloud Console, צריך לעדכן גם את ה-Secret ב-GitHub!

## ✅ שלבים לעדכון:

### שלב 1: קבל את ה-API Key החדש

1. לך ל-[Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. מצא את ה-API key שלך
4. **העתק** את המפתח החדש (או תעשה copy של המפתח הקיים)

### שלב 2: עדכן את ה-Secret ב-GitHub

1. לך ל: https://github.com/shaharprod/gemini-real-time-voice-chat/settings/secrets/actions

2. מצא את ה-Secret `GEMINI_API_KEY`

3. לחץ על ה-**עיפרון** (Edit) או לחץ על `GEMINI_API_KEY`

4. הדבק את ה-API key החדש ב-**Value**

5. לחץ **"Update secret"**

### שלב 3: הפעל פריסה מחדש

לאחר עדכון ה-Secret, צריך לפרוס מחדש:

**אפשרות א' - ידני (מומלץ):**
1. לך ל: https://github.com/shaharprod/gemini-real-time-voice-chat/actions
2. לחץ על **"Deploy to GitHub Pages"**
3. לחץ על **"Run workflow"** → **"Run workflow"**
4. זה יפעיל פריסה חדשה עם ה-API key החדש

**אפשרות ב' - אוטומטי:**
```bash
git add .
git commit -m "Update: trigger deployment with new API key"
git push origin main
```

### שלב 4: בדוק שהכל עובד

1. חכה שהפריסה תסתיים (כמה דקות)
2. לך ל-Actions ובדוק שה-run החדש ירוק ✅
3. פתח את האתר: https://shaharprod.github.io/gemini-real-time-voice-chat/
4. פתח Console (F12) ובדוק שאין שגיאות

---

## ⚠️ חשוב:

- אם שינית את ה-API key ב-Google, **חייב** לעדכן גם ב-GitHub Secrets!
- אם לא תעדכן, האתר ישתמש ב-API key הישן וייתכן שלא יעבוד

---

## 🧪 איך לבדוק שזה עובד:

1. **פתח Console** (F12)
2. **לחץ על המיקרופון**
3. **בדוק Console**:
   - אם יש `GEMINI_API_KEY is not set` = ה-Secret לא עודכן
   - אם יש `API Error` = יכול להיות שהמפתח לא תקין או אין הרשאות
   - אם אין שגיאות = אמור לעבוד! 🎉

---

## 🔍 אם עדיין לא עובד:

1. ודא שה-API key החדש תקין ב-Google Cloud Console
2. ודא שעדכנת את ה-Secret ב-GitHub (בדוק שהערך נכון)
3. ודא שהפריסה הצליחה (Actions → ה-run האחרון ירוק)
4. בדוק את ה-Console בשגיאות (F12)

אם עדיין יש בעיה, שלח את השגיאות מה-Console!

