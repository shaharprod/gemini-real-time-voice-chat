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
 * בונה שאילתת חיפוש מותאמת לפי הבקשה - כמו חיפוש רגיל בגוגל
 */
function buildSearchQuery(userInput: string, currentDate: {
  day: number;
  month: string;
  year: number;
  dateString: string;
}): { query: string; site?: string; isTodayNewsQuery: boolean } {
  const inputLower = userInput.toLowerCase().trim();
  const today = new Date();
  const todayStr = `${today.getDate()} ${currentDate.month} ${currentDate.year}`;

  // זהה בקשות לחיפוש באתרים ספציפיים
  let site: string | undefined;
  if (inputLower.includes('וינט') || inputLower.includes('ויינט') || inputLower.includes('בוינט') ||
      inputLower.includes('בויינט') || inputLower.includes('מוינט') || inputLower.includes('מויינט') ||
      inputLower.includes('ynet') || inputLower.includes('יי נט') || inputLower.includes('why net')) {
    site = 'ynet.co.il';
  } else if (inputLower.includes('וואלה') || inputLower.includes('walla') || inputLower.includes('בוואלה')) {
    site = 'walla.co.il';
  } else if (inputLower.includes('ako') || inputLower.includes('mako')) {
    site = 'mako.co.il';
  }

  // בדוק אם זה בקשה לחדשות מהיום
  const isTodayNewsQuery = (inputLower.includes('חדשות') || inputLower.includes('news')) &&
                           (inputLower.includes('היום') || inputLower.includes('today') || inputLower.includes('מהיום'));

  // נקה את השאילתה - הסר רק מילות עצירה בסיסיות שלא מוסיפות ערך
  // הסר מילים כמו "תחפשי", "תחפש", "בבקשה" אבל שמור את התוכן הרלוונטי
  let query = userInput.trim();

  // הסר רק מילות עצירה בסיסיות - לא יותר מדי
  const stopWords = ['תחפשי', 'תחפש', 'תמצאי', 'תמצא', 'בבקשה', 'please'];
  for (const stopWord of stopWords) {
    const regex = new RegExp(`\\b${stopWord}\\b`, 'gi');
    query = query.replace(regex, '').trim();
  }

  // הסר סימני פיסוק מיותרים בתחילת ובסוף
  query = query.replace(/^[.,!?;:\s]+|[.,!?;:\s]+$/g, '').trim();

  // אם יש בקשה לאתר ספציפי, הוסף site: לשאילתה
  if (site) {
    // הסר את שם האתר מהשאילתה (כי הוא כבר ב-site:)
    const siteNamePatterns = [
      /\s*(?:ב|מ|מ-)?וינט\s*/gi,
      /\s*(?:ב|מ|מ-)?ויינט\s*/gi,
      /\s*(?:ב|מ|מ-)?ynet\s*/gi,
      /\s*(?:ב|מ|מ-)?יי\s*נט\s*/gi,
      /\s*(?:ב|מ|מ-)?walla\s*/gi,
      /\s*(?:ב|מ|מ-)?וואלה\s*/gi,
      /\s*(?:ב|מ|מ-)?mako\s*/gi,
      /\s*(?:ב|מ|מ-)?מאקו\s*/gi
    ];

    for (const pattern of siteNamePatterns) {
      query = query.replace(pattern, ' ').trim();
    }

    query = `site:${site} ${query}`;
  }

  // אם זה בקשה לחדשות מהיום, הוסף תאריך
  if (isTodayNewsQuery && !query.toLowerCase().includes('היום') && !query.toLowerCase().includes('today')) {
    query = `${query} (${todayStr} OR היום)`;
  }

  // אם השאילתה ריקה אחרי הניקוי, החזר את הקלט המקורי
  if (!query || query.replace(/site:\S+\s*/g, '').trim().length < 2) {
    if (site) {
      query = `site:${site} ${userInput.trim()}`;
    } else {
      query = userInput.trim();
    }
  }

  // נרמל רווחים מרובים
  query = query.replace(/\s+/g, ' ').trim();

  return { query, site, isTodayNewsQuery };
}

/**
 * מסנן תוצאות חיפוש - מסיר דפי בית וניווט
 * מחזיר תוצאות מהיום או מאתמול (רק לחדשות מהיום) או כל התוצאות (לחיפוש כללי)
 */
function filterSearchResults(items: any[], isTodayNewsQuery: boolean = false): SearchResult[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // תאריכים שונים לבדיקה
  const todayStr = now.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
  const yesterdayStr = yesterday.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
  const todayNum = now.getDate();
  const yesterdayNum = yesterday.getDate();
  const monthStr = now.toLocaleDateString('he-IL', { month: 'long' });
  const year = now.getFullYear();

  // מילות מפתח שמעידות על תוכן ישן
  const oldContentKeywords = ['2024', '2023', '2022', '2021', '2020', 'לפני', 'אתמול שלשום', 'שבוע שעבר', 'חודש שעבר'];

  // בדוק אם תוצאה היא מהיום או מאתמול בלבד
  const isRecentResult = (item: any): boolean => {
    try {
      // נסה למצוא תאריך בתוצאה
      const snippet = (item.snippet || '').toLowerCase();
      const title = (item.title || item.htmlTitle || '').toLowerCase();
      const combinedText = snippet + ' ' + title;

      // בדוק אם יש מילות מפתח שמעידות על תוכן ישן
      for (const keyword of oldContentKeywords) {
        if (combinedText.includes(keyword.toLowerCase())) {
          // בדוק אם זה לא תאריך של היום
          if (!combinedText.includes(todayStr.toLowerCase()) &&
              !combinedText.includes(`${todayNum} ${monthStr}`.toLowerCase()) &&
              !combinedText.includes(`היום`)) {
            console.log(`⚠️ [פילטר] נשללה תוצאה ישנה: ${title.substring(0, 50)}`);
            return false;
          }
        }
      }

      // בדוק אם יש תאריך היום או אתמול
      const hasToday = combinedText.includes(todayStr.toLowerCase()) ||
                       combinedText.includes(`${todayNum} ${monthStr}`.toLowerCase()) ||
                       combinedText.includes(`היום`);

      const hasYesterday = combinedText.includes(yesterdayStr.toLowerCase()) ||
                          combinedText.includes(`${yesterdayNum} ${monthStr}`.toLowerCase()) ||
                          combinedText.includes(`אתמול`);

      // אם יש תאריך היום או אתמול - זה תוצאה עדכנית
      if (hasToday || hasYesterday) {
        return true;
      }

      // בדוק את ה-URL - לחיפוש כללי, נקבל תוצאות מכל אתר
      const url = (item.link || '').toLowerCase();

      // לחיפוש כללי - נקבל תוצאות מכל אתר (כמו חיפוש רגיל בגוגל)
      // רק נסנן תוכן ישן מאוד (2024, 2023 וכו')
      if (!isTodayNewsQuery) {
        // חיפוש כללי - נקבל את התוצאה אם היא לא נראית ישנה מאוד
        // גוגל רגיל מחזיר תוצאות מכל הזמנים
        if (!combinedText.includes('2022') && !combinedText.includes('2021') &&
            !combinedText.includes('2020') && !combinedText.includes('2019') &&
            !combinedText.includes('לפני שנים')) {
          console.log(`✅ [פילטר] מקבל תוצאה כללית: ${title.substring(0, 50)}`);
          return true;
        }
      } else {
        // חיפוש חדשות מהיום - נקבל רק תוצאות עדכניות
        if (url.includes('ynet.co.il') || url.includes('walla.co.il') || url.includes('mako.co.il') ||
            url.includes('themarker.com') || url.includes('calcalist.co.il') ||
            url.includes('ynetnews.com') || url.length > 5) {
          // נבדוק רק שההיום לא כתוב בפירוש שהוא ישן
          if (!combinedText.includes('2024') && !combinedText.includes('2023') &&
              !combinedText.includes('2022') && !combinedText.includes('2021') &&
              !combinedText.includes('לפני') && !combinedText.includes('אתמול שלשום')) {
            console.log(`✅ [פילטר] מקבל תוצאה מ-ynet/walla ללא תאריך מפורש: ${title.substring(0, 50)}`);
            return true;
          }
        }
      }

      // בדוק אם ה-URL כולל תאריך של השנה הנוכחית
      const urlHasDate = url.match(/\d{4}\/\d{2}\/\d{2}/) || url.match(/\d{8}/);
      const currentYear = new Date().getFullYear();
      if (urlHasDate && url.includes(currentYear.toString())) {
        // בדוק אם זה לא תאריך ישן
        const urlYearMatch = url.match(/\d{4}/);
        if (urlYearMatch && parseInt(urlYearMatch[0]) === currentYear) {
          return true;
        }
      }

      // אם זה חיפוש כללי (לא חדשות מהיום) - נקבל את התוצאה גם בלי תאריך
      if (!isTodayNewsQuery) {
        // חיפוש כללי - נקבל את התוצאה אם היא לא נראית ישנה מאוד
        // גוגל רגיל מחזיר תוצאות מכל הזמנים
        if (!combinedText.includes('2022') && !combinedText.includes('2021') &&
            !combinedText.includes('2020') && !combinedText.includes('2019') &&
            !combinedText.includes('לפני שנים')) {
          console.log(`✅ [פילטר] מקבל תוצאה כללית: ${title.substring(0, 50)}`);
          return true;
        }
      }

      // אם אין שום אינדיקציה - נשלול את התוצאה (לא נסמוך על API)
      console.log(`⚠️ [פילטר] נשללה תוצאה ללא תאריך: ${title.substring(0, 50)}`);
      return false;
    } catch {
      // אם לא הצלחנו לבדוק - נשלול את התוצאה (לא בטוח שהיא עדכנית)
      return false;
    }
  };

  return items
    .filter((item: any) => {
      try {
        const urlObj = new URL(item.link || '');
        const path = urlObj.pathname;

        // בדוק אם זה דף בית
        const isHomepage = path.length <= 1 || path === '/' ||
                          path === '/index.html' || path === '/index.php' ||
                          path === '/home' || path === '/homepage';

        // בדוק אם הכותרת היא ניווט או דף בית
        const title = (item.title || item.htmlTitle || '').toLowerCase();
        const snippet = (item.snippet || '').toLowerCase();
        const combinedText = title + ' ' + snippet;

        const isNavigation = (title.includes('ראשי') && !title.includes('כותרת') && !title.includes('חדשות')) ||
                            title.includes('תפריט') ||
                            title.includes('menu') ||
                            title.includes('navigation') ||
                            (title.includes('עמוד ראשי') && !title.includes('חדשות')) ||
                            title.includes('homepage') ||
                            title.includes('דף בית') ||
                            combinedText.includes('לכל הכתבות') ||
                            combinedText.includes('כל החדשות');

        // בדוק אם זה URL של מאמר או תוכן ספציפי
        const isArticlePath = path.includes('/news/') ||
                             path.includes('/article/') ||
                             path.includes('/item/') ||
                             path.includes('/story/') ||
                             path.includes('/breaking/') ||
                             path.includes('/post/') ||
                             path.includes('/entry/') ||
                             path.match(/\/[a-z0-9-]+\/[a-z0-9-]+/i) ||
                             path.length > 10;

        // בדוק אם התוצאה עדכנית (רק לחיפוש חדשות מהיום)
        // לחיפוש כללי - לא נגביל לפי תאריך (כמו חיפוש רגיל בגוגל)
        const isRecent = isTodayNewsQuery ? isRecentResult(item) : true;

        // בדוק אם זה תוכן רלוונטי - לא דף שגיאה, לא דף ריק, לא דף תוצאות חיפוש
        const isErrorPage = combinedText.includes('404') ||
                           combinedText.includes('not found') ||
                           combinedText.includes('לא נמצא') ||
                           combinedText.includes('שגיאה') ||
                           path.includes('/404') ||
                           path.includes('/error');

        // בדוק אם זה דף תוצאות חיפוש פנימי (לא רלוונטי)
        const isSearchResultsPage = combinedText.includes('תוצאות חיפוש') ||
                                   combinedText.includes('search results') ||
                                   path.includes('/search') ||
                                   path.includes('/results');

        // בדוק את ה-URL - לחיפוש כללי, נקבל תוצאות מכל אתר
        const url = (item.link || '').toLowerCase();

        // לחיפוש כללי - נקבל את התוצאה גם אם אין תאריך מפורש
        // רק נבדוק שזה לא דף בית או ניווט
        if (!isTodayNewsQuery) {
          // חיפוש כללי - נקבל את התוצאה אם זה לא דף בית, ניווט, שגיאה או תוצאות חיפוש
          // כמו חיפוש רגיל בגוגל - מחזיר את התוצאות הטובות ביותר
          // פחות אגרסיבי בסינון - רק נסיר דפי בית, ניווט ושגיאות
          // נקבל גם תוצאות עם path קצר יותר (path.length > 3 במקום 5)
          return !isHomepage && !isNavigation && !isErrorPage && !isSearchResultsPage &&
                 (isArticlePath || path.length > 3 || url.length > 20);
        }

        // חיפוש חדשות מהיום - נגביל לפי תאריך אבל גם פחות אגרסיבי
        // אם זה מאתר חדשות ידוע (ynet, walla, mako) - נקבל גם בלי תאריך מפורש אם זה נראה כתבה
        const isKnownNewsSite = url.includes('ynet.co.il') || url.includes('walla.co.il') ||
                               url.includes('mako.co.il') || url.includes('themarker.com') ||
                               url.includes('calcalist.co.il') || url.includes('ynetnews.com');

        if (isKnownNewsSite && isArticlePath && !isHomepage && !isNavigation && !isErrorPage) {
          // אם זה מאתר חדשות ידוע וזה נראה כמו כתבה - נקבל גם בלי תאריך מפורש
          return true;
        }

        // אחרת - נגביל לפי תאריך
        return !isHomepage && !isNavigation && !isErrorPage && !isSearchResultsPage &&
               (isArticlePath || path.length > 3 || url.length > 20) && isRecent;
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
      const snippetLower = (item.snippet || '').toLowerCase();
      const combinedLower = titleLower + ' ' + snippetLower;

      // בדוק אם זה תוכן גנרי או לא רלוונטי - פחות אגרסיבי
      // רק נסיר כותרות ברורות שהם דפי בית או ניווט
      const isGeneric = (titleLower.includes('ynet חדשות ועדכונים') && !titleLower.includes('כותרת')) ||
                       (titleLower.includes('כלכלה, ספורט, מבזקים') && !titleLower.includes('כותרת')) ||
                       (titleLower.includes('walla - חדשות') && !titleLower.includes('כותרת')) ||
                       (titleLower.includes('mako - חדשות') && !titleLower.includes('כותרת')) ||
                       (titleLower.includes('דף ראשי') && !titleLower.includes('כותרת')) ||
                       (titleLower.includes('homepage') && !titleLower.includes('כותרת')) ||
                       (combinedLower.includes('לכל הכתבות') && !titleLower.includes('כותרת')) ||
                       (combinedLower.includes('כל החדשות') && !titleLower.includes('כותרת'));

      // בדוק אם הכותרת היא רלוונטית - לא רק שם האתר
      // לחיפוש כללי - נקבל גם כותרות קצרות (מ-3 תווים במקום 5)
      const isRelevantTitle = item.title.length > 3 &&
                             !titleLower.match(/^(ynet|וינט|walla|וואלה|mako|ako|הארץ|הארץ|ישראל היום)$/i);

      // לחיפוש כללי - נקבל תוצאות גם עם כותרות קצרות (כמו חיפוש רגיל בגוגל)
      // אבל רק אם הן רלוונטיות - פחות אגרסיבי בסינון
      if (!isTodayNewsQuery) {
        return !isGeneric && isRelevantTitle && item.title.length > 3 && item.url.length > 10;
      }

      // לחיפוש חדשות מהיום - נגביל לכותרות ארוכות יותר ורלוונטיות
      // אבל גם פחות אגרסיבי - נקבל גם כותרות קצרות יותר (מ-5 תווים במקום 10)
      return !isGeneric && isRelevantTitle && item.title.length > 5 && item.url.length > 10;
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
  const { query: searchQuery, site, isTodayNewsQuery } = buildSearchQuery(userInput, currentDate);

  const isSiteSearch = !!site || searchQuery.includes('site:');

  // פרמטרים בסיסיים - כמו חיפוש רגיל בגוגל
  // num=10 - בקשת 10 תוצאות (המספר המקסימלי שמחזיר Google Custom Search API)
  let searchParams = `num=10&safe=active`;

  // הוסף שפה רק אם זה חיפוש בעברית
  const hasHebrew = /[\u0590-\u05FF]/.test(userInput);
  if (hasHebrew) {
    searchParams += `&lr=lang_he|lang_en`;
  }

  // אם המשתמש ביקש מפורש "חדשות היום" - הוסף סינון לפי תאריך
  if (isTodayNewsQuery || isSiteSearch) {
    const dateRestrict = isSiteSearch ? 'd7' : 'd1';
    searchParams += `&sort=date&dateRestrict=${dateRestrict}`;
  }
  // לחיפוש כללי - לא נגביל לפי תאריך (כמו חיפוש רגיל בגוגל)
  // גוגל מחזיר את התוצאות הטובות ביותר לפי רלוונטיות

  // אם המשתמש ביקש מפורש ישראל - הוסף פרמטרים גיאוגרפיים
  if (userInput.toLowerCase().includes('ישראל') || userInput.toLowerCase().includes('israel')) {
    searchParams += `&cr=countryIL&gl=il`;
  }

  let searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(searchQuery)}&${searchParams}`;

  console.log('🔍 [חיפוש באינטרנט] מתחיל חיפוש...');
  console.log('🔍 Query:', searchQuery);
  console.log('🔍 URL:', searchUrl.replace(apiKey, 'API_KEY_HIDDEN'));

  try {
    const startTime = Date.now();
    let response = await fetch(searchUrl);
    let fetchTime = Date.now() - startTime;

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

      // ננסה חיפוש חלופי ללא תאריך
      console.log('🔄 [חיפוש באינטרנט] מנסה חיפוש חלופי ללא תאריך...');
      const fallbackQuery = userInput.trim() + ' חדשות';
      const fallbackUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(fallbackQuery)}&num=10&lr=lang_he|lang_en&sort=date&safe=active&cr=countryIL&gl=il`;
      const fallbackResponse = await fetch(fallbackUrl);

      if (fallbackResponse.ok) {
        response = fallbackResponse;
        console.log('✅ [חיפוש באינטרנט] חיפוש חלופי הצליח');
      } else {
        return [];
      }
    }

    let data = await response.json();

    // אם לא נמצאו תוצאות עם d1 (רק לחיפוש חדשות מהיום), ננסה עם d7 (7 ימים אחרונים)
    if (isTodayNewsQuery && (!data.items || !Array.isArray(data.items) || data.items.length === 0)) {
      console.warn('⚠️ [חיפוש באינטרנט] לא נמצאו תוצאות עם d1, מנסה עם d7...');
      const fallbackParams = `num=10&lr=lang_he|lang_en&sort=date&dateRestrict=d7&safe=active&cr=countryIL&gl=il`;
      const fallbackUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(searchQuery)}&${fallbackParams}`;
      const fallbackStartTime = Date.now();
      const fallbackResponse = await fetch(fallbackUrl);
      fetchTime = Date.now() - fallbackStartTime;
      console.log(`⏱️ [חיפוש באינטרנט] תגובה מ-d7 התקבלה: ${fetchTime}ms, status: ${fallbackResponse.status}`);

      if (fallbackResponse.ok) {
        data = await fallbackResponse.json();
      }
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      console.warn('⚠️ [חיפוש באינטרנט] לא נמצאו תוצאות גם אחרי נסיון עם d7');
      return [];
    }

    console.log(`✅ [חיפוש באינטרנט] נמצאו ${data.items.length} תוצאות מהחיפוש`);

    // סנן תוצאות - העבר את סוג החיפוש (חדשות מהיום או כללי)
    const filteredResults = filterSearchResults(data.items, isTodayNewsQuery);

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

  // בדוק רלוונטיות של התוצאות לפני שליחה למודל
  // נוסיף בדיקה שהתוצאות תואמות לשאילתת החיפוש המקורית
  const relevantResults = results.filter((result, idx) => {
    // בדוק אם הכותרת או התקציר מכילים מילות מפתח מהשאילתה המקורית
    const titleLower = result.title.toLowerCase();
    const snippetLower = (result.snippet || '').toLowerCase();
    const combinedText = titleLower + ' ' + snippetLower;

    // חלץ מילות מפתח מהשאילתה המקורית (הסר מילות עצירה)
    const queryWords = userQuery.toLowerCase()
      .replace(/[.,!?;:()]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 &&
        !['את', 'אתה', 'אתי', 'אני', 'הוא', 'היא', 'הם', 'הן', 'של', 'על', 'אל', 'ב', 'ל', 'מ', 'כ', 'ה', 'ו', 'או', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with'].includes(word));

    // בדוק אם לפחות 30% ממילות המפתח מופיעות בתוצאה
    const matchingWords = queryWords.filter(word => combinedText.includes(word));
    const relevanceScore = queryWords.length > 0 ? matchingWords.length / queryWords.length : 1;

    // אם זה אחד מהתוצאות הראשונות (1-3), נקבל גם אם הרלוונטיות קצת נמוכה
    // כי גוגל בדרך כלל מחזיר את התוצאות הטובות ביותר ראשונות
    const isTopResult = idx < 3;
    const minRelevance = isTopResult ? 0.2 : 0.3;

    if (relevanceScore < minRelevance) {
      console.log(`⚠️ [פילטר רלוונטיות] נשללה תוצאה לא רלוונטית: ${result.title.substring(0, 50)} (ציון: ${(relevanceScore * 100).toFixed(0)}%)`);
      return false;
    }

    return true;
  });

  const resultsToSend = relevantResults.slice(0, 10); // שלוח עד 10 תוצאות מובילות לפי סדר ההופעה בגוגל
  // התוצאות מסודרות לפי סדר ההופעה בחיפוש בגוגל - לפי רלוונטיות
  const resultsText = resultsToSend.map((result, idx) => {
    // המספר מייצג את סדר ההופעה בתוצאות החיפוש (1 = התוצאה הראשונה, 2 = השנייה, וכו')
    let text = `תוצאה ${idx + 1} (לפי סדר ההופעה בחיפוש):\nכותרת: ${result.title}`;
    if (result.snippet && result.snippet.trim().length > 0) {
      // הוסף snippet אם קיים (עד 200 תווים)
      const snippet = result.snippet.trim().substring(0, 200);
      text += `\nתקציר: ${snippet}${result.snippet.length > 200 ? '...' : ''}`;
    }
    text += `\nלינק: ${result.url}`;
    return text;
  }).join('\n\n');

  // בדוק אם זה חיפוש חדשות מהיום (רק אם המשתמש ביקש מפורש)
  const isTodayNewsQuery = (userQuery.toLowerCase().includes('חדשות') || userQuery.toLowerCase().includes('news')) &&
                           (userQuery.toLowerCase().includes('היום') || userQuery.toLowerCase().includes('today') || userQuery.toLowerCase().includes('מהיום'));

  const messageToModel = isTodayNewsQuery
    ? `[חיפוש חדשות בוצע - תוצאות זמינות מהיום ${currentDay} ${currentMonth} ${currentYear} בלבד]\n\n${resultsText}\n\nCRITICAL INSTRUCTIONS - קרא בעיון:

CRITICAL - תשובה מלאה: תמיד תענה בצורה מלאה ומפורטת על כל בקשה של המשתמש. אל תפסיק באמצע התשובה - תמיד סיים את התשובה המלאה. אם המשתמש שואל שאלה, ענה עליה במלואה. אם המשתמש מבקש מידע, תן את כל המידע הרלוונטי. תמיד סיים את התשובה שלך - אל תשאיר תשובות חלקיות.

CRITICAL - סדר תוצאות: התוצאות מסודרות לפי סדר ההופעה בחיפוש בגוגל (1 = התוצאה הראשונה והרלוונטית ביותר, 2 = השנייה, וכו'). תמיד תן את הכותרות והלינקים לפי סדר ההופעה - מהתוצאה הראשונה (תוצאה 1) עד האחרונה (תוצאה 10). קרא את הכותרות לפי הסדר ותן את הלינקים לפי הסדר.

CRITICAL - רלוונטיות: התוצאות כבר סוננו להיות רלוונטיות לשאילתת החיפוש המקורית. השתמש רק בתוצאות שהכותרות או התקצירים שלהם תואמים לשאילתה המקורית. אם תוצאה לא נראית רלוונטית לשאילתה המקורית - אל תשתמש בה. תמיד תעדיף תוצאות שהכותרות והתקצירים שלהן תואמים בדיוק לשאילתה המקורית.

1. תאריך היום: ${currentDay} ${currentMonth} ${currentYear} (${currentDate}) - החיפוש בוצע עם הגבלה רק למהיום (24 שעות האחרונות בלבד) ומסודר לפי תאריך. תמיד בחר את התוצאות הרלוונטיות ביותר לשאילתה המקורית.
2. CRITICAL: השתמש רק בתוצאות החיפוש האלה - הן מהיום (${currentDay} ${currentMonth} ${currentYear}) בלבד! כל התוצאות כאן הן מהיום או מהשעות האחרונות.
3. CRITICAL: אם תוצאה מזכירה אנשים, אירועים, תאריכים, או שנים שהם NOT מהיום (${currentDay} ${currentMonth} ${currentYear}) - אל תשתמש בה! אמור "זה מידע ישן, אני אחפש מידע עדכני מהיום" ובקש חיפוש מחדש.
4. CRITICAL: אם תוצאה מזכירה "2024", "2023", "2022", "2021", "2020", "לפני", "אתמול שלשום", "שבוע שעבר", "חודש שעבר" - זה מידע ישן! אל תשתמש בה!
5. CRITICAL: אם תוצאה מזכירה "Biden" או "ביידן" כנשיא נוכחי - זה מידע ישן! אל תשתמש בה.
6. תן את כל הכותרות והלינקים מהתוצאות לפי סדר ההופעה - תמיד תן את הכותרות והלינקים לפי הסדר: תוצאה 1, תוצאה 2, תוצאה 3, וכו' עד תוצאה 10. קרא את הכותרות לפי הסדר ותן את הלינקים לפי הסדר. אם המשתמש מבקש את הלינק או הכתובת (בכל דרך, כולל עם רווחים לא נכונים: "תשלחי לי את הלינק", "תן לי את הלינק", "תני לי לינק", "תן לי את הכתובת", "תני לי את הכתובת", "איפה אני יכול לקנות", "תשלחי לי את הלינק למוצר", "תשלח לי את הלינק", "לינק", "לינ ק", "לינק לוויקיפדיה", "לינ ק לויקיפדיה", "תני לי לינק לוויקיפדיה", "תני לי ב בק שה לינק לוויקיפדיה", או כל בקשה שמזכירה "לינק", "לינ ק", "link", "כתובת", "URL"), שלח לו את ה-URL המלא (הכתובת המלאה) של התוצאה הרלוונטית מהתוצאות שקיבלת מיד. כל תוצאה כוללת "לינק: [URL]" - השתמש בכתובת הזו בדיוק כפי שהיא מופיעה. כתוב את הלינק המלא בתשובה שלך בדיוק כך: "הנה הלינק: [URL]" או "הכתובת היא: [URL]" - המשתמש יראה אותו בטקסט ויוכל ללחוץ עליו. אל תגיד "הכתובת זמינה" או "הלינק זמין" - שלח את הלינק המלא מיד!

CRITICAL - איסור קריאת לינקים בקול: לעולם, בשום מקרה, בשום תנאי, אל תקריא כתובת (URL) או לינק בקול! גם אם יש לינק בטקסט שלך, דלג עליו לגמרי כשאת מקריא בקול - רק כתוב אותו בטקסט. אל תגיד את הלינק בקול - אף לא מילה אחת מהלינק! כשאת רואה לינק בטקסט - דלג עליו לחלוטין בקריאה בקול!
7. השתמש בתקצירים (snippets) כדי להבין את התוכן של כל כתבה - זה יעזור לך לתת תשובות מדויקות יותר.
8. אל תמציא כותרות - השתמש רק במה שמופיע כאן.
9. אם יש "כותרת 1: [כותרת אמיתית]", תן את הכותרת האמיתית הזו - לא תיאור כללי של האתר.
10. הכתובות שמופיעות כאן הן כתובות ספציפיות לכתבות מהיום - השתמש בהן פנימית אבל אל תקריא אותן בקול.
11. CRITICAL - קריאת כתבות: אם המשתמש מבקש לקרוא כתבה (בכל דרך: "תקראי", "קרא", "תקרי", "כתבה ראשית", "כותרת ראשית"), המערכת תשלח לך את התוכן המלא של הכתבה בחלקים. כשאתה מקבל "[תוכן מאמר מהיום]", אתה חובה לקרוא את כל התוכן מילה במילה בקול! אל תסכם ואל תאמר "אני יכולה לקרוא רק חלק" - קרא את כל התוכן שמופיע.
12. אם יש לך מספר תוצאות - תן את כל הכותרות והלינקים לפי סדר ההופעה: תוצאה 1, תוצאה 2, תוצאה 3, וכו' עד תוצאה 10. קרא את הכותרות לפי הסדר ותן את הלינקים לפי הסדר. התוצאות מסודרות לפי רלוונטיות - התוצאות הראשונות (1, 2, 3) הן הרלוונטיות ביותר.
13. CRITICAL: אם אין לך תוצאות טובות מהיום - אמור "לא מצאתי חדשות עדכניות מהיום על הנושא הזה, נסה לשאול שאלה אחרת או לבדוק מאוחר יותר".`
    : `[חיפוש כללי בוצע - תוצאות זמינות]\n\n${resultsText}\n\nCRITICAL INSTRUCTIONS - קרא בעיון (כמו חיפוש רגיל בגוגל):

CRITICAL - תשובה מלאה: תמיד תענה בצורה מלאה ומפורטת על כל בקשה של המשתמש. אל תפסיק באמצע התשובה - תמיד סיים את התשובה המלאה. אם המשתמש שואל שאלה, ענה עליה במלואה. אם המשתמש מבקש מידע, תן את כל המידע הרלוונטי. תמיד סיים את התשובה שלך - אל תשאיר תשובות חלקיות.

CRITICAL - סדר תוצאות: התוצאות מסודרות לפי סדר ההופעה בחיפוש בגוגל (1 = התוצאה הראשונה והרלוונטית ביותר, 2 = השנייה, וכו'). תמיד תן את הכותרות והלינקים לפי סדר ההופעה - מהתוצאה הראשונה (תוצאה 1) עד האחרונה (תוצאה 10). קרא את הכותרות לפי הסדר ותן את הלינקים לפי הסדר.

CRITICAL - רלוונטיות: התוצאות כבר סוננו להיות רלוונטיות לשאילתת החיפוש המקורית. השתמש רק בתוצאות שהכותרות או התקצירים שלהם תואמים לשאילתה המקורית. אם תוצאה לא נראית רלוונטית לשאילתה המקורית - אל תשתמש בה. תמיד תעדיף תוצאות שהכותרות והתקצירים שלהן תואמים בדיוק לשאילתה המקורית.

1. זה חיפוש כללי באינטרנט - השתמש בתוצאות החיפוש כדי לענות על שאלת המשתמש (כמו חיפוש רגיל בגוגל). תמיד בחר את התוצאות הרלוונטיות ביותר לשאילתה המקורית.
2. התוצאות מסודרות לפי רלוונטיות (לא לפי תאריך) - השתמש בתוצאות הרלוונטיות ביותר לשאלת המשתמש לפי סדר ההופעה בחיפוש.
3. תן את כל הכותרות והלינקים מהתוצאות לפי סדר ההופעה - תמיד תן את הכותרות והלינקים לפי הסדר: תוצאה 1, תוצאה 2, תוצאה 3, וכו' עד תוצאה 10. קרא את הכותרות לפי הסדר ותן את הלינקים לפי הסדר. אם המשתמש מבקש את הלינק או הכתובת (בכל דרך, כולל עם רווחים לא נכונים: "תשלחי לי את הלינק", "תן לי את הלינק", "תני לי לינק", "תן לי את הכתובת", "תני לי את הכתובת", "איפה אני יכול לקנות", "תשלחי לי את הלינק למוצר", "תשלח לי את הלינק", "לינק", "לינ ק", "לינק לוויקיפדיה", "לינ ק לויקיפדיה", "תני לי לינק לוויקיפדיה", "תני לי ב בק שה לינק לוויקיפדיה", או כל בקשה שמזכירה "לינק", "לינ ק", "link", "כתובת", "URL"), שלח לו את ה-URL המלא (הכתובת המלאה) של התוצאה הרלוונטית מהתוצאות שקיבלת מיד. כל תוצאה כוללת "לינק: [URL]" - השתמש בכתובת הזו בדיוק כפי שהיא מופיעה. כתוב את הלינק המלא בתשובה שלך בדיוק כך: "הנה הלינק: [URL]" או "הכתובת היא: [URL]" - המשתמש יראה אותו בטקסט ויוכל ללחוץ עליו. אל תגיד "הכתובת זמינה" או "הלינק זמין" - שלח את הלינק המלא מיד!

CRITICAL - איסור קריאת לינקים בקול: לעולם, בשום מקרה, בשום תנאי, אל תקריא כתובת (URL) או לינק בקול! גם אם יש לינק בטקסט שלך, דלג עליו לגמרי כשאת מקריא בקול - רק כתוב אותו בטקסט. אל תגיד את הלינק בקול - אף לא מילה אחת מהלינק! כשאת רואה לינק בטקסט - דלג עליו לחלוטין בקריאה בקול!
4. השתמש בתקצירים (snippets) כדי להבין את התוכן של כל תוצאה - זה יעזור לך לתת תשובות מדויקות יותר.
5. אל תמציא כותרות או תוכן - השתמש רק במה שמופיע כאן.
6. אם יש "כותרת 1: [כותרת אמיתית]", תן את הכותרת האמיתית הזו - לא תיאור כללי של האתר.
7. הכתובות שמופיעות כאן הן כתובות ספציפיות - השתמש בהן פנימית אבל אל תקריא אותן בקול.
8. אם יש לך מספר תוצאות - תן את כל הכותרות והלינקים לפי סדר ההופעה: תוצאה 1, תוצאה 2, תוצאה 3, וכו' עד תוצאה 10. התוצאות מסודרות לפי רלוונטיות - התוצאות הראשונות (1, 2, 3) הן הרלוונטיות ביותר לשאלת המשתמש.
9. אם התוצאות לא רלוונטיות - אמור "לא מצאתי תוצאות רלוונטיות, נסה לשאול שאלה אחרת או לפרט יותר".`;

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
  console.log('\n🌐🌐🌐 ========================================');
  console.log('🌐 [מנגנון חיפוש באינטרנט] מתחיל');
  console.log('🌐 שאילתת חיפוש:', userInput.substring(0, 100));
  console.log('🌐 ========================================\n');

  // שלב 1: בדוק הגדרות
  if (!config.apiKey || !config.cx) {
    console.error('❌❌❌ ========================================');
    console.error('❌ [מנגנון חיפוש] API Key או CX חסרים!');
    console.error('❌ API Key:', config.apiKey ? 'PRESENT' : 'MISSING ❌');
    console.error('❌ CX:', config.cx ? 'PRESENT' : 'MISSING ❌');
    console.error('❌ כדי להפעיל חיפוש, ודא שהגדרת את GOOGLE_CUSTOM_SEARCH_API_KEY ו-GOOGLE_CUSTOM_SEARCH_CX');
    console.error('❌ ========================================\n');
    return { success: false, results: [], sentToModel: false };
  }

  // שלב 2: בדוק חיבור למודל
  if (!config.session && !config.sessionPromise) {
    console.error('❌❌❌ ========================================');
    console.error('❌ [מנגנון חיפוש] המודל לא מחובר! אין session');
    console.error('❌ ודא שהשיחה פעילה לפני ביצוע חיפוש');
    console.error('❌ ========================================\n');
    return { success: false, results: [], sentToModel: false };
  }

  console.log('✅✅✅ [מנגנון חיפוש] הגדרות תקינות');
  console.log('✅ API Key: PRESENT');
  console.log('✅ CX: PRESENT');
  console.log('✅ חיבור למודל:', config.session ? 'פעיל ✅' : 'ממתין...');

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

