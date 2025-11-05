/**
 * מנגנון חיפוש באינטרנט - מחובר למודל Gemini
 *
 * מנגנון זה מטפל בכל החיפושים באינטרנט ומחבר אותם למודל
 * דרך session.sendRealtimeInput
 */

import { Session } from "@google/genai";

export interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
}

export interface SearchConfig {
  apiKey: string;
  cx: string;
  session: Session | null;
  sessionPromise: Promise<Session> | null;
}

/**
 * בונה שאילתת חיפוש מותאמת לפי הבקשה
 */
function buildSearchQuery(userInput: string, currentDate: {
  day: number;
  month: string;
  year: number;
  dateString: string;
}): string {
  const inputLower = userInput.toLowerCase().trim();

  // חיפוש ספציפי לאתרי חדשות
  if (inputLower.includes('כותרות') || inputLower.includes('ynet') || inputLower.includes('וינט')) {
    return `site:ynet.co.il/news OR site:ynet.co.il/article ${currentDate.day} ${currentDate.month} ${currentDate.year} "היום" חדשות`;
  }

  if (inputLower.includes('walla') || inputLower.includes('וואלה')) {
    return `site:walla.co.il/news OR site:walla.co.il/item ${currentDate.day} ${currentDate.month} ${currentDate.year} "היום" חדשות`;
  }

  if (inputLower.includes('cnn')) {
    return `site:cnn.com ${currentDate.month} ${currentDate.day} ${currentDate.year} "today" news`;
  }

  // חיפוש כללי עם תאריך
  return `${userInput.trim()} "${currentDate.day} ${currentDate.month} ${currentDate.year}" "היום" ${currentDate.year}`;
}

/**
 * מסנן תוצאות חיפוש - מסיר דפי בית וכללי
 */
function filterSearchResults(items: any[]): SearchResult[] {
  return items
    .filter((item: any) => {
      try {
        const urlObj = new URL(item.link || '');
        const path = urlObj.pathname;

        // בדוק אם זה דף בית
        const isHomepage = path.length <= 1 || path === '/' ||
                          path === '/index.html' || path === '/index.php';

        // בדוק אם הכותרת היא ניווט
        const title = (item.title || item.htmlTitle || '').toLowerCase();
        const isNavigation = (title.includes('ראשי') && !title.includes('כותרת') && !title.includes('חדשות')) ||
                            title.includes('תפריט') ||
                            (title.includes('עמוד ראשי') && !title.includes('חדשות')) ||
                            title.length < 10;

        // בדוק אם זה URL של מאמר
        const isArticlePath = path.includes('/news/') ||
                             path.includes('/article/') ||
                             path.includes('/item/') ||
                             path.includes('/story/') ||
                             path.includes('/breaking/') ||
                             path.match(/\/[a-z0-9-]+\/[a-z0-9-]+/i) ||
                             path.length > 10;

        return !isHomepage && !isNavigation && (isArticlePath || path.length > 5);
      } catch {
        return false;
      }
    })
    .map((item: any) => {
      let title = item.htmlTitle || item.title || item.snippet || '';

      // נקה את הכותרת
      title = title.replace(/^(ynet|וינט|walla|וואלה)\s*[:-]\s*/i, '').trim();

      // הסר תיאורים כלליים
      if (title.toLowerCase().includes('ynet חדשות ועדכונים') ||
          title.toLowerCase().includes('כלכלה, ספורט, מבזקים')) {
        title = item.snippet || title;
      }

      return {
        title: title,
        url: item.link || '',
        snippet: item.snippet
      };
    })
    .filter(item => {
      const titleLower = item.title.toLowerCase();
      const isGeneric = titleLower.includes('ynet חדשות ועדכונים') ||
                       titleLower.includes('כלכלה, ספורט, מבזקים') ||
                       titleLower.length < 10;
      return !isGeneric && item.title.length > 10 && item.url.length > 10;
    });
}

/**
 * מבצע חיפוש באינטרנט באמצעות Google Custom Search API
 */
export async function performInternetSearch(
  userInput: string,
  config: SearchConfig
): Promise<SearchResult[]> {
  const { apiKey, cx } = config;

  if (!apiKey || !cx) {
    console.error('❌ Custom Search API not configured!');
    console.error('API Key:', apiKey ? 'PRESENT' : 'MISSING');
    console.error('CX:', cx ? 'PRESENT' : 'MISSING');
    return [];
  }

  // בנה תאריך נוכחי
  const now = new Date();
  const currentDate = {
    day: now.getDate(),
    month: now.toLocaleDateString('he-IL', { month: 'long' }),
    year: now.getFullYear(),
    dateString: now.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
  };

  // בנה שאילתת חיפוש
  const searchQuery = buildSearchQuery(userInput, currentDate);

  // בנה URL לחיפוש - הורד את dateRestrict=d1 כי זה לפעמים מוגבל מדי
  // השתמש ב-sort=date אבל לא תגביל רק ל-24 שעות האחרונות
  const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(searchQuery)}&num=10&lr=lang_he|lang_en&sort=date`;

  console.log('🔍 [חיפוש באינטרנט] מתחיל חיפוש...');
  console.log('🔍 Query:', searchQuery);
  console.log('🔍 URL:', searchUrl.replace(apiKey, 'API_KEY_HIDDEN'));

  try {
    const startTime = Date.now();
    const response = await fetch(searchUrl);
    const fetchTime = Date.now() - startTime;

    console.log(`⏱️ [חיפוש באינטרנט] תגובה התקבלה: ${fetchTime}ms, status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [חיפוש באינטרנט] שגיאה:', response.status, response.statusText);
      console.error('Error:', errorText.substring(0, 500));

      // ניסה לפרסר שגיאה
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          console.error('API Error:', errorData.error.message);
        }
      } catch (e) {
        // לא JSON
      }

      return [];
    }

    const data = await response.json();

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      console.warn('⚠️ [חיפוש באינטרנט] לא נמצאו תוצאות');
      return [];
    }

    console.log(`✅ [חיפוש באינטרנט] נמצאו ${data.items.length} תוצאות מהחיפוש`);

    // סנן תוצאות
    const filteredResults = filterSearchResults(data.items);

    console.log(`✅ [חיפוש באינטרנט] ${filteredResults.length} תוצאות תקפות אחרי סינון`);

    if (filteredResults.length > 0) {
      console.log('📋 [חיפוש באינטרנט] תוצאות ראשונות:');
      filteredResults.slice(0, 5).forEach((result, idx) => {
        console.log(`  ${idx + 1}. ${result.title}`);
        console.log(`     ${result.url}`);
      });
    }

    return filteredResults;

  } catch (error: any) {
    console.error('❌ [חיפוש באינטרנט] שגיאה בחיפוש:', error);
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });
    return [];
  }
}

/**
 * שולח תוצאות חיפוש למודל דרך session.sendRealtimeInput
 *
 * זו הפונקציה המרכזית שמחברת את החיפוש למודל!
 */
export async function sendSearchResultsToModel(
  results: SearchResult[],
  config: SearchConfig,
  userQuery: string
): Promise<boolean> {
  const { session, sessionPromise } = config;

  // קבל session - נסה מהמטמון או מההבטחה
  let activeSession: Session | null = session;

  if (!activeSession && sessionPromise) {
    try {
      console.log('📤 [חיפוש באינטרנט] מחכה ל-session...');
      activeSession = await sessionPromise;
      console.log('✅ [חיפוש באינטרנט] session התקבל');
    } catch (err) {
      console.error('❌ [חיפוש באינטרנט] שגיאה בקבלת session:', err);
      return false;
    }
  }

  if (!activeSession) {
    console.error('❌ [חיפוש באינטרנט] אין session זמין! המודל לא מחובר.');
    console.error('💡 ודא שהשיחה פעילה והמודל מחובר');
    return false;
  }

  // בדוק שהמודל מחובר
  try {
    // נסה לבדוק את ה-session - אם יש לו sendRealtimeInput, הוא תקין
    if (typeof activeSession.sendRealtimeInput !== 'function') {
      console.error('❌ [חיפוש באינטרנט] session לא תקין - אין sendRealtimeInput');
      return false;
    }

    console.log('✅ [חיפוש באינטרנט] המודל מחובר! שולח תוצאות...');
  } catch (err) {
    console.error('❌ [חיפוש באינטרנט] שגיאה בבדיקת session:', err);
    return false;
  }

  // בנה הודעת תוצאות למודל
  const now = new Date();
  const currentDate = now.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });
  const currentYear = now.getFullYear();
  const currentMonth = now.toLocaleDateString('he-IL', { month: 'long' });
  const currentDay = now.getDate();

  const resultsToSend = results.slice(0, 5);
  const resultsText = resultsToSend.map((result, idx) =>
    `כותרת ${idx + 1}: ${result.title}. מקור: ${result.url}`
  ).join('\n');

  const messageToModel = `[חיפוש בוצע - תוצאות זמינות מהיום ${currentDay} ${currentMonth} ${currentYear}]\n${resultsText}\n\nCRITICAL INSTRUCTIONS:
1. תאריך היום: ${currentDay} ${currentMonth} ${currentYear} (${currentDate})
2. השתמש רק בתוצאות החיפוש האלה אם הן מהיום (${currentDay} ${currentMonth} ${currentYear}) או מהשעות האחרונות.
3. אם תוצאה מזכירה אנשים, אירועים או תאריכים שהם NOT מהיום - אל תשתמש בה! אמור "זה מידע ישן, אני אחפש מידע עדכני מהיום" ובקש חיפוש מחדש.
4. CRITICAL: אם תוצאה מזכירה "Biden" או "ביידן" כנשיא נוכחי - זה מידע ישן! אל תשתמש בה.
5. תן את כל הכותרות עם הכתובות המלאות מהתוצאות - הכתובות האלה הן ספציפיות לכתבות, לא דף בית!
6. אל תמציא כותרות - השתמש רק במה שמופיע כאן.
7. אם יש "כותרת 1: [כותרת אמיתית]", תן את הכותרת האמיתית הזו - לא תיאור כללי של האתר.
8. הכתובות שמופיעות כאן הן כתובות ספציפיות לכתבות - השתמש בהן בדיוק כפי שהן מופיעות.
9. CRITICAL - קריאת כתבות: אם המשתמש מבקש לקרוא כתבה (בכל דרך: "תקראי", "קרא", "תקרי", "כתבה ראשית", "כותרת ראשית"), המערכת תשלח לך את התוכן המלא של הכתבה בחלקים. כשאתה מקבל "[תוכן מאמר מהיום]", אתה חובה לקרוא את כל התוכן מילה במילה בקול! אל תסכם ואל תאמר "אני יכולה לקרוא רק חלק" - קרא את כל התוכן שמופיע.`;

  try {
    console.log('📤 [חיפוש באינטרנט] שולח תוצאות למודל...');
    console.log('📤 Session type:', typeof activeSession);
    console.log('📤 Message length:', messageToModel.length);

    // זה השלב המרכזי - שליחת התוצאות למודל!
    activeSession.sendRealtimeInput({
      text: messageToModel
    });

    console.log('✅✅✅ [חיפוש באינטרנט] תוצאות נשלחו למודל בהצלחה!');
    console.log('✅ המודל קיבל את התוצאות ויכול להשתמש בהן');

    return true;

  } catch (error: any) {
    console.error('❌❌❌ [חיפוש באינטרנט] שגיאה בשליחת תוצאות למודל!');
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });
    console.error('💡 זה אומר שהמודל לא מחובר או שיש בעיה בתקשורת');
    return false;
  }
}

/**
 * שולח תוכן כתבה למודל בחלקים - קורא את כל הכתבה מילה במילה
 */
export async function sendArticleContentToModel(
  content: string,
  title: string,
  config: SearchConfig
): Promise<boolean> {
  const { session, sessionPromise } = config;

  let activeSession: Session | null = session;

  if (!activeSession && sessionPromise) {
    try {
      activeSession = await sessionPromise;
    } catch (err) {
      console.error('❌ [קריאת כתבה] שגיאה בקבלת session:', err);
      return false;
    }
  }

  if (!activeSession) {
    console.error('❌ [קריאת כתבה] אין session זמין!');
    return false;
  }

  // חלוקה לחלקים של 8000 תווים
  const maxChunkSize = 8000;
  const chunks = content.match(new RegExp(`.{1,${maxChunkSize}}`, 'g')) || [content];

  console.log(`📖 [קריאת כתבה] שולח ${chunks.length} חלקים למודל (${content.length} תווים בסך הכל)`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const isLastChunk = i === chunks.length - 1;

    const message = `[תוכן מאמר מהיום${chunks.length > 1 ? ` - חלק ${i + 1} מתוך ${chunks.length}` : ''} - ${title}]\n${chunk}\n\nCRITICAL: קרא את כל התוכן הזה בקול, מילה במילה, מהתחלה ועד הסוף. אל תסכם - אל תאמר "כאן יגיע תוכן" או "התוכן יוקרא" - קרא את התוכן עכשיו! ${isLastChunk ? 'זה התוכן המלא של הכתבה - קרא אותו מילה במילה בקול.' : 'קרא את החלק הזה בקול מילה במילה עכשיו, ואני אשלח לך את החלק הבא.'}`;

    try {
      console.log(`📤 [קריאת כתבה] שולח חלק ${i + 1}/${chunks.length} (${chunk.length} תווים)`);
      activeSession.sendRealtimeInput({
        text: message
      });

      // המתן קצת בין חלקים
      if (!isLastChunk) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } catch (err: any) {
      console.error(`❌ [קריאת כתבה] שגיאה בשליחת חלק ${i + 1}:`, err);
      return false;
    }
  }

  console.log('✅✅✅ [קריאת כתבה] כל התוכן נשלח למודל בהצלחה!');
  return true;
}

/**
 * פונקציה מרכזית שמבצעת חיפוש ושולחת למודל
 *
 * זו הפונקציה הראשית שצריך לקרוא לה!
 */
export async function searchAndSendToModel(
  userInput: string,
  config: SearchConfig
): Promise<{ success: boolean; results: SearchResult[]; sentToModel: boolean }> {
  console.log('\n🌐 ========================================');
  console.log('🌐 [מנגנון חיפוש באינטרנט] מתחיל');
  console.log('🌐 ========================================\n');

  // שלב 1: בדוק הגדרות
  if (!config.apiKey || !config.cx) {
    console.error('❌ [מנגנון חיפוש] API Key או CX חסרים!');
    return { success: false, results: [], sentToModel: false };
  }

  // שלב 2: בדוק חיבור למודל
  if (!config.session && !config.sessionPromise) {
    console.error('❌ [מנגנון חיפוש] המודל לא מחובר! אין session');
    return { success: false, results: [], sentToModel: false };
  }

  console.log('✅ [מנגנון חיפוש] הגדרות תקינות');
  console.log('✅ [מנגנון חיפוש] חיבור למודל:', config.session ? 'פעיל' : 'ממתין...');

  // שלב 3: בצע חיפוש
  const results = await performInternetSearch(userInput, config);

  if (results.length === 0) {
    console.warn('⚠️ [מנגנון חיפוש] לא נמצאו תוצאות');
    return { success: true, results: [], sentToModel: false };
  }

  // שלב 4: שלח למודל
  const sentToModel = await sendSearchResultsToModel(results, config, userInput);

  console.log('\n🌐 ========================================');
  if (sentToModel) {
    console.log('✅✅✅ [מנגנון חיפוש] הושלם בהצלחה!');
    console.log('✅ המודל קיבל את התוצאות ויכול להשתמש בהן');
  } else {
    console.error('❌❌❌ [מנגנון חיפוש] שגיאה בשליחה למודל!');
  }
  console.log('🌐 ========================================\n');

  return {
    success: true,
    results,
    sentToModel
  };
}

