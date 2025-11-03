# 🔧 תיקון בעיות ב-GitHub Pages

## הבעיה: האתר לא עובד ב-GitHub Pages אבל עובד לוקאלית

זה אומר שה-API key לא מוגדר ב-GitHub Secrets!

## ✅ פתרון:

### שלב 1: הגדר Secret ב-GitHub

1. לך ל-https://github.com/shaharprod/gemini-real-time-voice-chat/settings/secrets/actions

2. אם **אין** Secret בשם `GEMINI_API_KEY`:
   - לחץ על **"New repository secret"**
   - **Name**: `GEMINI_API_KEY`
   - **Secret**: המפתח API שלך (מה-`.env.local` שלך)
   - לחץ **"Add secret"**

### שלב 2: ודא ש-GitHub Pages מוגדר נכון

1. לך ל-https://github.com/shaharprod/gemini-real-time-voice-chat/settings/pages

2. ודא ש:
   - **Source**: **GitHub Actions** (לא `gh-pages` branch!)
   - **Custom domain**: (אופציונלי) ריק

### שלב 3: הפעל פריסה מחדש

**אפשרות א' - אוטומטי:**
- פשוט תעשה push לקוד:
```bash
git add .
git commit -m "Trigger deployment"
git push origin main
```

**אפשרות ב' - ידני:**
1. לך ל-https://github.com/shaharprod/gemini-real-time-voice-chat/actions
2. לחץ על **"Deploy to GitHub Pages"**
3. לחץ על **"Run workflow"** → **"Run workflow"**
4. זה יפעיל פריסה חדשה עם ה-Secret

### שלב 4: בדוק שהפריסה הצליחה

1. לך ל-https://github.com/shaharprod/gemini-real-time-voice-chat/actions
2. לחץ על ה-run האחרון
3. ודא שכל השלבים ירוקים (✅)
4. אם יש שגיאה (❌), לחץ עליה ובדוק מה השגיאה

---

## ⚠️ בעיות נפוצות:

### בעיה 1: "GEMINI_API_KEY is not set"

**פתרון**: ה-Secret לא מוגדר או נקרא בשם שגוי
- ודא שהשם הוא בדיוק: `GEMINI_API_KEY`
- ודא שהמפתח שלך תקין

### בעיה 2: Deployment נכשל

**פתרון**: בדוק את ה-Logs ב-GitHub Actions
- לך ל-Actions → לחץ על ה-run הכושל → בדוק את ה-Logs

### בעיה 3: האתר לא נטען

**פתרון**: ודא שה-base path נכון
- ה-URL חייב להיות: `https://shaharprod.github.io/gemini-real-time-voice-chat/`
- עם `/` בסוף!

### בעיה 4: API לא עובד

**פתרון**: 
1. ודא שה-Secret מוגדר נכון
2. ודא שהמפתח API תקף
3. בדוק שה-GitHub Actions הצליח לבנות עם המפתח

---

## 🧪 איך לבדוק שזה עובד:

1. **פתח את האתר**: https://shaharprod.github.io/gemini-real-time-voice-chat/
2. **פתח Console** (F12)
3. **לחץ על המיקרופון**
4. **בדוק Console**:
   - אם יש שגיאה `GEMINI_API_KEY is not set` = ה-Secret לא מוגדר
   - אם יש שגיאה אחרת = שלח אותה

---

## 📝 סיכום:

1. ✅ ודא ש-GitHub Actions רץ והצליח (Actions tab)
2. ✅ ודא שיש Secret `GEMINI_API_KEY` (Settings → Secrets)
3. ✅ ודא ש-GitHub Pages מוגדר ל-GitHub Actions (Settings → Pages)
4. ✅ הפעל פריסה חדשה אם צריך

אם עדיין לא עובד, שלח את השגיאה מה-Console!

