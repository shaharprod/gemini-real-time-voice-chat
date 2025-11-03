# 🔧 פתרון בעיות

## האפליקציה לא עובדת? בואו נבדוק יחד:

### 1. בדיקת API Key ⚠️

**הבעיה**: אם ה-API key לא מוגדר, האפליקציה לא תעבוד.

**פתרון**:
- **בלוקאלי**: ודא שיש קובץ `.env.local` עם `GEMINI_API_KEY=your_key`
- **ב-GitHub Pages**: ודא שיש Secret ב-GitHub:
  1. לך ל-https://github.com/shaharprod/gemini-real-time-voice-chat/settings/secrets/actions
  2. ודא שיש Secret בשם `GEMINI_API_KEY`
  3. אם אין, הוסף אותו!

**איך לבדוק אם API key תקין**:
פתח את ה-Console בדפדפן (F12) ובדוק אם יש שגיאה:
- `GEMINI_API_KEY is not set` = המפתח לא מוגדר
- `API Error` = המפתח לא תקין או אין הרשאות

---

### 2. בעיית מיקרופון 🎤

**הבעיה**: אם המיקרופון לא עובד, האפליקציה לא יכולה לקלוט אודיו.

**פתרון**:
1. ודא שהדפדפן מאפשר גישה למיקרופון
2. בדוק את הגדרות הדפדפן:
   - Chrome: Settings → Privacy and security → Site settings → Microphone
   - Firefox: Settings → Privacy & Security → Permissions → Microphone
3. ודא שהאתר רץ ב-HTTPS (GitHub Pages מספק)

**איך לבדוק**:
פתח את ה-Console (F12) ובדוק אם יש:
- `Microphone permission denied` = לא נתת הרשאה
- `Error setting up audio` = יש בעיה בהגדרת המיקרופון

---

### 3. בעיית חיבור ל-Gemini API 🔌

**הבעיה**: אם החיבור ל-Gemini API נכשל, האפליקציה לא תעבוד.

**פתרון**:
1. ודא שה-API key תקף
2. בדוק אם יש quotas או מגבלות על המפתח
3. ודא שיש חיבור אינטרנט

**איך לבדוק**:
פתח את ה-Console (F12) ובדוק אם יש:
- `Connection error` = בעיה בחיבור
- `API Error` = בעיה עם ה-API key

---

### 4. בעיות Deployment 🚀

**הבעיה**: אם ה-Deployment נכשל, האתר לא יעבוד.

**פתרון**:
1. בדוק את GitHub Actions:
   - לך ל-https://github.com/shaharprod/gemini-real-time-voice-chat/actions
   - בדוק אם ה-Deployment האחרון הצליח
   - אם נכשל, לחץ עליו ובדוק את ה-Logs

2. ודא שה-GitHub Pages מוגדר נכון:
   - Settings → Pages
   - Source: **GitHub Actions**

---

### 5. בדיקות מהירות ✅

**רוץ את הבדיקות הבאות**:

1. **פתח את ה-Console** (F12)
2. **בדוק שגיאות**:
   ```javascript
   // אם יש שגיאות, תראה אותן כאן
   ```
3. **בדוק Network tab**:
   - לחץ על Network (F12 → Network)
   - נסה להפעיל את המיקרופון
   - בדוק אם יש קריאות ל-Gemini API

4. **בדוק אם API key מוגדר**:
   - פתח Console
   - הקלד: `process.env.GEMINI_API_KEY`
   - אם זה `undefined` או `""` - המפתח לא מוגדר!

---

## איפה לקבל עזרה?

אם שום דבר לא עובד:

1. **בדוק את ה-Logs ב-GitHub Actions**
2. **בדוק את ה-Console בדפדפן** (F12)
3. **בדוק את Network tab** (F12 → Network)
4. **ודא שה-API key תקף ב-Google Cloud Console**

---

## דף בדיקה מהיר

פתח את ה-Console (F12) והרץ:

```javascript
// בדיקה 1: API Key
console.log('API Key exists:', !!process.env.GEMINI_API_KEY);

// בדיקה 2: Media Devices
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('✅ Microphone works!');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => console.error('❌ Microphone error:', err));

// בדיקה 3: AudioContext
const ctx = new AudioContext();
console.log('AudioContext state:', ctx.state);
```

אם משהו לא עובד, תעתיק את השגיאות ותשלח לי!

