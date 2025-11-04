# 🔍 הגדרת Google Custom Search API

## מה זה Google Custom Search API?

Google Custom Search API מאפשר לך ליצור מנוע חיפוש מותאם אישית שמחפש בכל האינטרנט. זה יכול להיות יותר מדויק מאשר Google Search Grounding.

## שלב 1: צור Custom Search Engine

1. לך ל-[Google Custom Search](https://programmablesearchengine.google.com/controlpanel/create)
2. לחץ על **"Add"** או **"Create a custom search engine"**
3. מילוי הפרטים:
   - **Sites to search**: השאר ריק כדי לחפש בכל האינטרנט, או הזן אתרים ספציפיים (למשל: `*.ynet.co.il`, `*.walla.co.il`)
   - **Name**: שם למנוע החיפוש (למשל: "My Voice Chat Search")
   - **Language**: בחר **Hebrew** או **All languages**
4. לחץ **"Create"**

## שלב 2: קבל את CX (Search Engine ID)

1. לאחר יצירת מנוע החיפוש, לחץ עליו
2. תחת **"Setup"** → **"Basics"**, תמצא את **"Search engine ID"** (CX)
3. העתק את ה-CX (נראה כמו: `83f6b2cb223604c2f`)

**הערה**: הקוד שהתקבל (`<script async src="https://cse.google.com/cse.js?cx=83f6b2cb223604c2f">`) הוא ל-embed של החיפוש באתר, אבל אנחנו צריכים את ה-CX הזה גם ל-API. ה-CX שלך הוא: `83f6b2cb223604c2f`

## שלב 3: קבל API Key

1. לך ל-[Google Cloud Console](https://console.cloud.google.com/)
2. בחר את הפרויקט שלך (או צור פרויקט חדש)
3. לך ל-**APIs & Services** → **Library**
4. חפש **"Custom Search API"**
5. לחץ עליו ולחץ **"Enable"**
6. לך ל-**APIs & Services** → **Credentials**
7. לחץ **"+ CREATE CREDENTIALS"** → **"API key"**
8. העתק את ה-API key

**חשוב**: הגבל את ה-API key רק ל-**Custom Search API** (תחת **API restrictions**)

## שלב 4: הגדר את המשתנים

### לוקאלי (.env.local):

```env
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_CUSTOM_SEARCH_API_KEY=your_custom_search_api_key_here
GOOGLE_CUSTOM_SEARCH_CX=83f6b2cb223604c2f
```

**הערה**: ה-CX שלך הוא: `83f6b2cb223604c2f` (כבר מוכן ✅)

### GitHub Pages (GitHub Secrets):

1. לך ל-**Settings** → **Secrets and variables** → **Actions**
2. לחץ **"New repository secret"**
3. הוסף שני secrets:
   - **Name**: `GOOGLE_CUSTOM_SEARCH_API_KEY`, **Value**: המפתח שלך
   - **Name**: `GOOGLE_CUSTOM_SEARCH_CX`, **Value**: ה-CX שלך

4. **הערה**: הקובץ `.github/workflows/deploy.yml` כבר עודכן עם המשתנים החדשים! ✅

אם אתה צריך לעדכן אותו ידנית, הוסף את המשתנים הבאים תחת `env:` בקטע `Build`:

```yaml
- name: Build
  run: npm run build
  env:
    NODE_ENV: production
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
    API_KEY: ${{ secrets.GEMINI_API_KEY }}
    GOOGLE_CUSTOM_SEARCH_API_KEY: ${{ secrets.GOOGLE_CUSTOM_SEARCH_API_KEY }}
    GOOGLE_CUSTOM_SEARCH_CX: ${{ secrets.GOOGLE_CUSTOM_SEARCH_CX }}
```

## שימוש

הפונקציה `searchWithCustomSearch` זמינה ב-`useVoiceChat` hook. אתה יכול להשתמש בה:

```typescript
const results = await searchWithCustomSearch("חדשות ישראל היום");
// results = [{ title: "...", link: "...", snippet: "..." }, ...]
```

## ⚠️ הערות חשובות:

1. **מחירים**: Google Custom Search API נותן 100 חיפושים חינם ביום, ואז 5$ לכל 1000 חיפושים
2. **הגבלות**: ודא שהפעלת רק את **Custom Search API** ב-API key restrictions
3. **אבטחה**: אל תחשוף את המפתח ב-client-side code (אבל זה frontend, אז זה עדיין יהיה גלוי)

## 🔧 אם לא עובד:

1. ודא שהפעלת את Custom Search API ב-Google Cloud Console
2. ודא שה-API key כולל הרשאות ל-Custom Search API
3. ודא שה-CX נכון (Search Engine ID)
4. בדוק את ה-Console (F12) לשגיאות

