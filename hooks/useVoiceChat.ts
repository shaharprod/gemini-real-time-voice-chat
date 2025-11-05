import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Session } from "@google/genai";
import { AppStatus, ConversationTurn, SourceInfo } from '../types';
import { searchAndSendToModel, sendArticleContentToModel, SearchConfig } from './internetSearch';

// --- Audio Utility Functions ---

// Base64 encoding
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Base64 decoding
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decode raw PCM audio data into an AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


const STORAGE_KEY = 'gemini-voice-chat-history';

// Function to fix transcription with incorrect spacing
function fixTranscriptionSpacing(text: string): string {
  if (!text || text.trim().length === 0) return text;

  // Remove extra spaces and fix common spacing issues
  let fixed = text.trim();

  // Fix common Hebrew words that get split incorrectly
  const commonWords: { [key: string]: string } = {
    'ב בק שה': 'בבקשה',
    'ב בק ש': 'בבקשה',
    'בב קשה': 'בבקשה',
    'ב בקשה': 'בבקשה',
    'לינ ק': 'לינק',
    'לינקים': 'לינקים',
    'כות ר ות': 'כותרות',
    'כותרות': 'כותרות',
    'חד שות': 'חדשות',
    'חדשות': 'חדשות',
    'מה יום': 'מהיום',
    'מהיום': 'מהיום',
    'ב וי נט': 'בוינט',
    'בו אי נט': 'בוינט',
    'בוינט': 'בוינט',
    'ת ני': 'תני',
    'תני': 'תני',
    'רוא ה': 'רואה',
    'רואה': 'רואה',
    'מ ל ך': 'מלך',
    'מלך': 'מלך',
    'ביק ש תי': 'ביקשתי',
    'ביקשתי': 'ביקשתי',
    'מ ווינט': 'מוינט',
    'מוינט': 'מוינט',
    'פשים': 'תחפשי',
    'ת חפשי': 'תחפשי',
    'תחפשי': 'תחפשי'
  };

  // Replace common split words
  for (const [wrong, correct] of Object.entries(commonWords)) {
    const regex = new RegExp(wrong.replace(/\s+/g, '\\s+'), 'gi');
    fixed = fixed.replace(regex, correct);
  }

  // Fix spacing between Hebrew words (remove spaces within words)
  // Pattern: Hebrew letter, space, Hebrew letter (within a word)
  fixed = fixed.replace(/([\u0590-\u05FF])\s+([\u0590-\u05FF])/g, (match, char1, char2) => {
    // Check if this is likely a word boundary (next char is not Hebrew) or if it's a common split
    const before = fixed.substring(Math.max(0, fixed.indexOf(match) - 10), fixed.indexOf(match));
    const after = fixed.substring(fixed.indexOf(match) + match.length, fixed.indexOf(match) + match.length + 10);

    // If surrounded by Hebrew letters, it's likely a split word
    if (/[\u0590-\u05FF]/.test(before) && /[\u0590-\u05FF]/.test(after)) {
      return char1 + char2; // Remove space within word
    }
    return match; // Keep space if it's a word boundary
  });

  // Normalize multiple spaces to single space
  fixed = fixed.replace(/\s+/g, ' ');

  // Fix spacing around punctuation
  fixed = fixed.replace(/\s+([.,!?;:])/g, '$1');
  fixed = fixed.replace(/([.,!?;:])\s+/g, '$1 ');

  return fixed.trim();
}

export const useVoiceChat = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [transcript, setTranscript] = useState<ConversationTurn[]>(() => {
    // Load saved history from localStorage on mount
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (err) {
      console.error('Failed to load saved history:', err);
    }
    return [];
  });
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<SourceInfo[]>([]); // URLs with titles from search results
  const [isSearchEnabled, setIsSearchEnabled] = useState(true); // Control for real-time search
  const [isPaused, setIsPaused] = useState(false); // Control for pausing reading
  const [isAssistantMuted, setIsAssistantMuted] = useState(false); // Control for muting assistant
  const [isCustomSearchEnabled, setIsCustomSearchEnabled] = useState(true); // Control for Google Custom Search API - default enabled
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'connected' | 'error' | 'no-api'>('idle'); // Search status indicator
  const [lastSearchTime, setLastSearchTime] = useState<Date | null>(null); // Last successful search time
  const [apiConnectionStatus, setApiConnectionStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking'); // API connection status
  // Removed searchResultsCache - always perform fresh searches for real-time results
  const sessionRef = useRef<Session | null>(null); // Store the actual session for sending search results

  const sessionPromiseRef = useRef<Promise<Session> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const isDictationModeRef = useRef<boolean>(false);
  const isWebSocketClosedRef = useRef<boolean>(false);
  const audioProcessingEnabledRef = useRef<boolean>(false);

  const currentTurnIdRef = useRef<string | null>(null);
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  const nextStartTimeRef = useRef(0);

  // בדיקה ראשונית של חיבור ל-API
  useEffect(() => {
    const checkApiConnection = () => {
      const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || '';
      const cx = process.env.GOOGLE_CUSTOM_SEARCH_CX || '';

      if (apiKey && cx) {
        setApiConnectionStatus('checking');
        // נסה לבצע חיפוש בדיקה קטן (רק לבדוק שהחיבור עובד)
        const testUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=test&num=1`;
        fetch(testUrl)
          .then(response => {
            if (response.ok) {
              setApiConnectionStatus('connected');
              console.log('✅ [בדיקת API] Custom Search API מחובר');
            } else {
              setApiConnectionStatus('error');
              console.error('❌ [בדיקת API] שגיאה בחיבור ל-Custom Search API:', response.status);
            }
          })
          .catch(err => {
            setApiConnectionStatus('error');
            console.error('❌ [בדיקת API] שגיאה בחיבור ל-Custom Search API:', err);
          });
      } else {
        setApiConnectionStatus('disconnected');
        console.warn('⚠️ [בדיקת API] Custom Search API לא מוגדר');
      }
    };

    // בדוק את החיבור כשהאפליקציה נטענת
    checkApiConnection();

    // בדוק מחדש כל 30 שניות
    const interval = setInterval(checkApiConnection, 30000);

    return () => clearInterval(interval);
  }, []);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Real-time mute control: stop/start audio immediately when mute state changes
  useEffect(() => {
    if (isAssistantMuted) {
      // Immediately stop all currently playing audio when muted
      if (audioSourcesRef.current.size > 0) {
        audioSourcesRef.current.forEach(source => {
          try {
            source.stop();
          } catch (err) {
            // Source might already be stopped
            console.log('Audio source already stopped');
          }
        });
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
      }
    } else {
      // When unmuted, ensure AudioContext is ready to play next audio chunk
      if (outputAudioContextRef.current) {
        const ctx = outputAudioContextRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(err => {
            console.error('Failed to resume AudioContext:', err);
          });
        }
      }
    }
    // Next audio chunk will play automatically when unmuted
  }, [isAssistantMuted]);

  const startDictationOnly = useCallback(() => {
    if (status !== AppStatus.IDLE && status !== AppStatus.ERROR) return;

    // Check if browser supports Speech Recognition API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech Recognition API is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    setStatus(AppStatus.TRANSCRIBING);
    setError(null);
    isDictationModeRef.current = true;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'he-IL'; // Hebrew, can be changed to 'en-US' or other languages

      let currentUserText = '';
      let currentTurnId = Date.now().toString();

      recognition.onstart = () => {
        setStatus(AppStatus.TRANSCRIBING);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        currentUserText = finalTranscript || interimTranscript;

        // Update transcript with user input only (no assistant response)
        setTranscript(prev => {
          const newTranscript = [...prev];
          const turnIndex = newTranscript.findIndex(t => t.id === currentTurnId);

          if (turnIndex !== -1) {
            newTranscript[turnIndex] = {
              ...newTranscript[turnIndex],
              user: currentUserText.trim(),
              assistant: '', // No assistant response in dictation mode
              isFinal: !!finalTranscript
            };
          } else if (currentUserText.trim()) {
            newTranscript.push({
              id: currentTurnId,
              user: currentUserText.trim(),
              assistant: '',
              isFinal: !!finalTranscript
            });
          }

          // Save to localStorage
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newTranscript));
          } catch (err) {
            console.error('Failed to save history:', err);
          }

          return newTranscript;
        });

        // Start new turn for final results
        if (finalTranscript) {
          currentTurnId = Date.now().toString();
          currentUserText = '';
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // This is common, just continue listening
          return;
        }
        setError(`Speech recognition error: ${event.error}`);
        setStatus(AppStatus.ERROR);
      };

      recognition.onend = () => {
        if (isDictationModeRef.current) {
          // Restart recognition if still in dictation mode
          try {
            recognition.start();
          } catch (err) {
            // Recognition might already be starting
            console.log('Recognition already starting or stopped');
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start dictation:', err);
      setError(err.message || 'Failed to initialize speech recognition.');
      setStatus(AppStatus.ERROR);
      isDictationModeRef.current = false;
    }
  }, [status]);

  const updateTranscript = (userText: string, assistantText: string, isFinal: boolean) => {
    setTranscript(prev => {
        const newTranscript = [...prev];
        if (currentTurnIdRef.current) {
            const turnIndex = newTranscript.findIndex(t => t.id === currentTurnIdRef.current);
            if (turnIndex !== -1) {
                newTranscript[turnIndex] = { ...newTranscript[turnIndex], user: userText, assistant: assistantText, isFinal };
                // Save to localStorage
                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(newTranscript));
                } catch (err) {
                  console.error('Failed to save history:', err);
                }
                return newTranscript;
            }
        }

        const newTurnId = Date.now().toString();
        currentTurnIdRef.current = newTurnId;
        const updated = [...newTranscript, { id: newTurnId, user: userText, assistant: assistantText, isFinal }];
        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (err) {
          console.error('Failed to save history:', err);
        }
        return updated;
    });
  };

  // Function to fetch article content from URL (must be defined before handleServerMessage)
  const fetchArticleContent = useCallback(async (url: string): Promise<string | null> => {
    // Try multiple proxy services as fallback
    const proxies = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    ];

    for (const proxyUrl of proxies) {
      try {
        console.log(`Trying proxy: ${proxyUrl.substring(0, 50)}...`);
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });

        if (!response.ok) {
          console.warn(`Proxy failed with status ${response.status}`);
          continue;
        }

        let htmlContent: string;
        if (proxyUrl.includes('allorigins.win')) {
          const data = await response.json();
          htmlContent = data.contents || '';
        } else {
          htmlContent = await response.text();
        }

        if (!htmlContent || htmlContent.length < 100) {
          console.warn('Proxy returned empty or very short content');
          continue;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        // Remove unwanted elements
        const unwantedSelectors = 'script, style, nav, footer, header, aside, .comments, .social-share, .advertisement, [class*="ad"], iframe, noscript';
        doc.querySelectorAll(unwantedSelectors).forEach(el => el.remove());

        // Try multiple selectors for article content (prioritize more specific ones)
        const articleContent =
          // Ynet specific
          doc.querySelector('.art_body_content')?.textContent ||
          doc.querySelector('[class*="articleBody"]')?.textContent ||
          doc.querySelector('[id*="article"]')?.textContent ||
          // Generic article selectors
          doc.querySelector('article')?.textContent ||
          doc.querySelector('.article-content')?.textContent ||
          doc.querySelector('.article-body')?.textContent ||
          doc.querySelector('.post-content')?.textContent ||
          doc.querySelector('[class*="article"]')?.textContent ||
          doc.querySelector('[class*="content"]')?.textContent ||
          doc.querySelector('main')?.textContent ||
          doc.querySelector('.main-content')?.textContent ||
          // Fallback to body but clean it better
          (() => {
            const body = doc.body?.textContent || '';
            // Try to remove navigation, ads, etc. from body text
            return body.replace(/^\s*(?:קרא עוד|עוד בחדשות|פרסומת|תגובות|שתף|like|share).*$/gmi, '').trim();
          })();

        if (articleContent && articleContent.length > 50) {
          // Clean up the text
          const cleaned = articleContent
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n')
            .replace(/[^\u0590-\u05FF\u0020-\u007F\n]/g, '') // Keep Hebrew, English, and basic punctuation
            .trim();

          if (cleaned.length > 100) {
            console.log(`Successfully fetched article content (${cleaned.length} chars)`);
            return cleaned.substring(0, 10000); // Limit to 10000 characters
          }
        }

        console.warn('Could not find article content in HTML');
        // If we got HTML but couldn't extract content, try next proxy
        continue;
      } catch (err) {
        console.error(`Proxy error for ${proxyUrl.substring(0, 50)}:`, err);
        continue;
      }
    }

    // All proxies failed
    console.error('All proxies failed to fetch article content');
    return null;
  }, []);

  const handleServerMessage = useCallback(async (message: LiveServerMessage) => {
    // Log message structure for debugging
    if (message.serverContent) {
      console.log('📨 Server message:', {
        hasInputTranscription: !!message.serverContent.inputTranscription,
        hasOutputTranscription: !!message.serverContent.outputTranscription,
        hasModelTurn: !!message.serverContent.modelTurn,
        hasGroundingMetadata: !!(message.serverContent as any).groundingMetadata,
        messageKeys: Object.keys(message.serverContent)
      });

      // Check if grounding metadata exists (indicates search was performed)
      if ((message.serverContent as any).groundingMetadata) {
        console.log('✅ Grounding metadata found - search was performed!', (message.serverContent as any).groundingMetadata);
      }
    }

    if (message.serverContent?.inputTranscription) {
      const rawText = message.serverContent.inputTranscription.text;
      // Fix transcription spacing issues
      const text = fixTranscriptionSpacing(rawText);

      // Gemini Live API שולח את כל הטקסט עד עכשיו, לא רק את החלק החדש
      // אם הטקסט החדש ארוך יותר או שווה לטקסט הקודם, נשתמש בו ישירות (הוא כולל את הטקסט הקודם)
      // אם הטקסט החדש קצר יותר, נוסיף אותו לטקסט הקודם (זה רק החלק החדש)
      // שיפור: אם הטקסט החדש מתחיל עם הטקסט הקודם, נשתמש בו ישירות (הוא עדכון מלא)
      const fixedCurrentText = fixTranscriptionSpacing(currentInputTranscriptionRef.current);

      if (text.length >= fixedCurrentText.length ||
          text.startsWith(fixedCurrentText) ||
          (fixedCurrentText.length > 0 && text.includes(fixedCurrentText))) {
        // הטקסט החדש כבר כולל את הטקסט הקודם - נשתמש בו ישירות
        currentInputTranscriptionRef.current = text;
      } else if (text.length > 0 && fixedCurrentText.length > 0) {
        // הטקסט החדש הוא רק החלק החדש - נוסיף אותו עם רווח
        // וודא שלא נחתוך משפט באמצע - אם הטקסט הקודם לא מסתיים בסימן פיסוק, הוסף רווח
        const lastChar = fixedCurrentText[fixedCurrentText.length - 1];
        const needsSpace = !['.', '!', '?', ':', ';', ',', ' ', '\n'].includes(lastChar);
        currentInputTranscriptionRef.current = fixedCurrentText + (needsSpace ? ' ' : '') + text;
        // Fix spacing again after combining
        currentInputTranscriptionRef.current = fixTranscriptionSpacing(currentInputTranscriptionRef.current);
      } else {
        // זה הטקסט הראשון או הטקסט החדש ריק - נשתמש בו ישירות
        currentInputTranscriptionRef.current = text;
      }
      const fullTextSoFar = currentInputTranscriptionRef.current;

      // Auto-detect search requests and use Custom Search API if enabled
      // זיהוי בקשות חיפוש - גם חדשות וגם חיפוש כללי
      // מילות מפתח לחדשות - כולל וריאציות עם רווחים לא נכונים
      const newsKeywords = ['כותרות', 'כותרת', 'כותרות', 'ynet', 'וינט', 'ויינט', 'בוינט', 'בויינט', 'מוינט', 'מויינט', 'יי נט', 'why net', 'כותרת ראשית', 'כתבה ראשית', 'מה חדש', 'מה קרה', 'חדשות היום', 'מבזקים', 'חדשות', 'מה המצב', 'מה קורה', 'חדשות ישראל', 'חדשות עולם', 'תחפשי', 'פשים', 'תחפש', 'חפש'];
      const isNewsRequest = newsKeywords.some(keyword =>
        fullTextSoFar.toLowerCase().includes(keyword.toLowerCase())
      );

      // מילות מפתח לחיפוש כללי - מילים שמעידות על בקשה לחיפוש
      const searchRequestKeywords = ['חפש', 'מחפש', 'חיפוש', 'search', 'find', 'מצא', 'תחפש', 'תמצא', 'תחפשי', 'תמצאי', 'תחפשו', 'תמצאו', 'חפש לי', 'מצא לי', 'חפשי לי', 'מצאי לי', 'מה זה', 'מי זה', 'איפה', 'איך', 'למה', 'מתי', 'מהו', 'מהי', 'מיהו', 'מיהי'];
      const isGeneralSearchRequest = searchRequestKeywords.some(keyword =>
        fullTextSoFar.toLowerCase().includes(keyword.toLowerCase())
      );

      // אם השאלה נראית כמו בקשה לחיפוש (מתחילה ב-מה/מי/איפה/איך/למה/מתי או מכילה מילות חיפוש)
      const questionPattern = /^(מה|מי|איפה|איך|למה|מתי|מהו|מהי|מיהו|מיהי|איזה|איזו|אילו)/i;
      const isQuestionLike = questionPattern.test(fullTextSoFar.trim()) || fullTextSoFar.length > 10;

      // אם המשתמש ביקש מפורש "תחפש" או "תמצא" או שזו שאלה שנראית כמו בקשה לחיפוש
      const shouldAlwaysSearch = isNewsRequest || isGeneralSearchRequest || (isQuestionLike && fullTextSoFar.length > 15);

      if (shouldAlwaysSearch && (isCustomSearchEnabled || isSearchEnabled)) {
        const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || '';
        const cx = process.env.GOOGLE_CUSTOM_SEARCH_CX || '';

        // בדיקה מפורטת של הגדרות
        console.log('\n🔍🔍🔍 ========================================');
        console.log('🔍 [בדיקת חיפוש בזמן אמת]');
        console.log('🔍 isSearchEnabled:', isSearchEnabled);
        console.log('🔍 isCustomSearchEnabled:', isCustomSearchEnabled);
        console.log('🔍 shouldAlwaysSearch:', shouldAlwaysSearch);
        console.log('🔍 API Key:', apiKey ? `PRESENT (${apiKey.substring(0, 10)}...)` : 'MISSING ❌');
        console.log('🔍 CX:', cx ? `PRESENT (${cx})` : 'MISSING ❌');
        console.log('🔍 טקסט המשתמש:', fullTextSoFar.substring(0, 100));
        console.log('🔍 ========================================\n');

        if (apiKey && cx) {
          // Don't await - search in parallel so it doesn't block transcription
          (async () => {
            try {
              console.log('\n✅✅✅ ========================================');
              console.log('✅ [חיפוש בזמן אמת] מתחיל חיפוש חדש!');
              console.log('✅ API Key: PRESENT');
              console.log('✅ CX: PRESENT');
              console.log('✅ טקסט המשתמש:', fullTextSoFar.substring(0, 100));
              console.log('✅ שולח בקשה ל-Google Custom Search API...');
              console.log('✅ ========================================\n');

              // Get session
              let session = sessionRef.current;
              if (!session && sessionPromiseRef.current) {
                try {
                  session = await sessionPromiseRef.current;
                  sessionRef.current = session;
                } catch (err) {
                  console.error('❌ Failed to get session:', err);
                  return;
                }
              }

              if (!session) {
                console.warn('⚠️ No session available for search');
                return;
              }

              // Use the new search mechanism
              const searchConfig: SearchConfig = {
                apiKey,
                cx,
                session,
                sessionPromise: sessionPromiseRef.current
              };

              const { success, results, sentToModel } = await searchAndSendToModel(fullTextSoFar.trim(), searchConfig);

              console.log('\n📊📊📊 ========================================');
              console.log('📊 [תוצאות חיפוש]');
              console.log('📊 success:', success);
              console.log('📊 results.length:', results.length);
              console.log('📊 sentToModel:', sentToModel);
              if (results.length > 0) {
                console.log('📊 תוצאות ראשונות:');
                results.slice(0, 3).forEach((r, i) => {
                  console.log(`📊   ${i + 1}. ${r.title.substring(0, 60)}`);
                  console.log(`📊      ${r.url.substring(0, 60)}`);
                });
              } else {
                console.log('⚠️ לא נמצאו תוצאות!');
              }
              console.log('📊 ========================================\n');

              // עדכן סטטוס חיפוש
              if (success && sentToModel && results.length > 0) {
                setSearchStatus('connected');
                setApiConnectionStatus('connected');
                setLastSearchTime(new Date());
              } else if (success && results.length > 0) {
                setSearchStatus('error');
                setApiConnectionStatus('error');
              } else if (success) {
                setSearchStatus('idle');
                setApiConnectionStatus('connected');
              } else {
                setSearchStatus('error');
                setApiConnectionStatus('error');
              }

              if (success && results.length > 0) {
                // Add to sources
                const searchResults: SourceInfo[] = results.map(result => ({
                  url: result.url,
                  title: result.title
                }));

                setSources(prev => {
                  const combined = [...prev, ...searchResults];
                  // Remove duplicates by URL
                  const unique = combined.reduce((acc, current) => {
                    if (!acc.find(item => item.url === current.url)) {
                      acc.push(current);
                    }
                    return acc;
                  }, [] as SourceInfo[]);
                  return unique;
                });

                if (sentToModel) {
                  console.log('✅✅✅ [חיפוש בזמן אמת] תוצאות נשלחו למודל בהצלחה!');
                } else {
                  console.warn('⚠️ [חיפוש בזמן אמת] תוצאות נמצאו אבל לא נשלחו למודל');
                }
              } else {
                console.warn('⚠️ [חיפוש בזמן אמת] לא נמצאו תוצאות או שגיאה בחיפוש');
              }
            } catch (err) {
              console.error('\n❌❌❌ ========================================');
              console.error('❌ [שגיאה בחיפוש]');
              console.error('❌ Error:', err);
              console.error('❌ ========================================\n');
              setSearchStatus('error');
              setApiConnectionStatus('error');
            }
          })();
        } else {
          console.warn('\n⚠️⚠️⚠️ ========================================');
          console.warn('⚠️ [Custom Search API לא מוגדר]');
          console.warn('⚠️ API Key:', apiKey ? 'PRESENT' : 'MISSING ❌');
          console.warn('⚠️ CX:', cx ? 'PRESENT' : 'MISSING ❌');
          console.warn('⚠️ כדי להפעיל חיפוש, ודא שהגדרת את GOOGLE_CUSTOM_SEARCH_API_KEY ו-GOOGLE_CUSTOM_SEARCH_CX ב-.env.local');
          console.warn('⚠️ ========================================\n');
          setSearchStatus('no-api');
          setApiConnectionStatus('disconnected');
        }
      }

      // Check if user wants to read an article
      const readArticleKeywords = ['תקראי לי', 'תקרי לי', 'תקראי את', 'תקרי את', 'קרא לי', 'קרא את', 'כתבה ראשית', 'כותרת ראשית', 'תקראי את הכתבה', 'תקרי את הכתבה', 'לא מעניין אותי המקור תקראי את הכתבה'];
      const userWantsToReadArticle = readArticleKeywords.some(keyword =>
        fullTextSoFar.toLowerCase().includes(keyword.toLowerCase())
      );

      if (userWantsToReadArticle) {
        // Don't await - read in parallel so it doesn't block transcription
        (async () => {
          try {
            console.log('📖 [קריאת כתבה] מזהה בקשה לקריאת כתבה');

            // Get session
            let session = sessionRef.current;
            if (!session && sessionPromiseRef.current) {
              try {
                session = await sessionPromiseRef.current;
                sessionRef.current = session;
              } catch (err) {
                console.error('❌ [קריאת כתבה] שגיאה בקבלת session:', err);
                return;
              }
            }

            if (!session) {
              console.warn('⚠️ [קריאת כתבה] אין session זמין');
              return;
            }

            // Find the article URL - prioritize from sources or assistant's output
            let articleUrl: string | null = null;
            let articleTitle: string | null = null;

            // First, try to find URL from sources (most recent first)
            if (sources.length > 0) {
              const firstSource = sources[0];
              if (firstSource.url && firstSource.url.length > 10) {
                articleUrl = firstSource.url;
                articleTitle = firstSource.title || null;
                console.log('📖 [קריאת כתבה] נמצא URL ממקורות:', articleUrl);
              }
            }

            // If no URL found, check if user mentioned a specific URL in their request
            if (!articleUrl) {
              const urlPattern = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi;
              const urlMatches = fullTextSoFar.match(urlPattern);
              if (urlMatches && urlMatches.length > 0) {
                articleUrl = urlMatches[0];
                console.log('📖 [קריאת כתבה] נמצא URL מהקלט:', articleUrl);
              }
            }

            if (!articleUrl) {
              console.warn('⚠️ [קריאת כתבה] לא נמצא URL לקריאה');
              return;
            }

            // Fetch article content
            console.log('📖 [קריאת כתבה] מביא תוכן מהכתובת:', articleUrl);
            const content = await fetchArticleContent(articleUrl);

            if (!content || content.length < 50) {
              console.warn('⚠️ [קריאת כתבה] לא הצלחתי להביא תוכן מהכתבה');
              return;
            }

            console.log(`📖 [קריאת כתבה] תוכן התקבל: ${content.length} תווים`);

            // Send article content to model using sendArticleContentToModel
            const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || '';
            const cx = process.env.GOOGLE_CUSTOM_SEARCH_CX || '';
            const searchConfig: SearchConfig = {
              apiKey,
              cx,
              session,
              sessionPromise: sessionPromiseRef.current
            };

            const success = await sendArticleContentToModel(
              content,
              articleTitle || 'כתבה',
              searchConfig
            );

            if (success) {
              console.log('✅✅✅ [קריאת כתבה] תוכן נשלח למודל בהצלחה!');
            } else {
              console.error('❌ [קריאת כתבה] שגיאה בשליחת תוכן למודל');
            }
          } catch (err) {
            console.error('❌ [קריאת כתבה] שגיאה בקריאת כתבה:', err);
          }
        })();
      }

      // עדכן את התמלול עם הטקסט החדש של המשתמש
      updateTranscript(currentInputTranscriptionRef.current, currentOutputTranscriptionRef.current, false);
    }

    if (message.serverContent?.outputTranscription) {
      setStatus(AppStatus.SPEAKING);
      const text = message.serverContent.outputTranscription.text;
      // Gemini Live API שולח את כל הטקסט עד עכשיו, לא רק את החלק החדש
      // אם הטקסט החדש ארוך יותר או שווה לטקסט הקודם, נשתמש בו ישירות (הוא כולל את הטקסט הקודם)
      // אם הטקסט החדש קצר יותר, נוסיף אותו לטקסט הקודם (זה רק החלק החדש)
      // שיפור: אם הטקסט החדש מתחיל עם הטקסט הקודם, נשתמש בו ישירות (הוא עדכון מלא)
      if (text.length >= currentOutputTranscriptionRef.current.length ||
          text.startsWith(currentOutputTranscriptionRef.current) ||
          (currentOutputTranscriptionRef.current.length > 0 && text.includes(currentOutputTranscriptionRef.current))) {
        // הטקסט החדש כבר כולל את הטקסט הקודם - נשתמש בו ישירות
        currentOutputTranscriptionRef.current = text;
      } else if (text.length > 0 && currentOutputTranscriptionRef.current.length > 0) {
        // הטקסט החדש הוא רק החלק החדש - נוסיף אותו עם רווח
        // וודא שלא נחתוך משפט באמצע - אם הטקסט הקודם לא מסתיים בסימן פיסוק, הוסף רווח
        const lastChar = currentOutputTranscriptionRef.current[currentOutputTranscriptionRef.current.length - 1];
        const needsSpace = !['.', '!', '?', ':', ';', ',', ' ', '\n'].includes(lastChar);
        currentOutputTranscriptionRef.current = currentOutputTranscriptionRef.current + (needsSpace ? ' ' : '') + text;
      } else {
        // זה הטקסט הראשון או הטקסט החדש ריק - נשתמש בו ישירות
        currentOutputTranscriptionRef.current = text;
      }
      // עדכן את התמלול עם הטקסט החדש של העוזרת
      updateTranscript(currentInputTranscriptionRef.current, currentOutputTranscriptionRef.current, false);

      // Check if the response mentions searching but no URLs were found
      const mentionsSearch = text.toLowerCase().includes('חיפשתי') || text.toLowerCase().includes('מחפש') || text.toLowerCase().includes('חיפוש');
      const hasNoResults = text.toLowerCase().includes('לא מצאתי') || text.toLowerCase().includes('לא נמצא');

      if (mentionsSearch && hasNoResults) {
        console.warn('⚠️ AI mentions searching but found no results - Google Search Grounding may not be working');
        console.warn('💡 Consider using Custom Search API instead or verify Google Search Grounding is enabled in Google Cloud Console');
      }

      // Extract URLs and titles from the text
      // Pattern 1: "כותרת: [title]. מקור: [URL]" or "כותרת: [title]\nמקור: [URL]"
      // Pattern 2: "[title]. מקור: [URL]" or "[title]. מקור: [URL]"
      // Pattern 3: Just URLs with "מקור:" or "Source:"
      // Pattern 4: Direct URLs
      // Pattern 5: Titles without URLs (will search for URL automatically)

      const titleUrlPattern = /(?:כותרת:\s*([^\n.]+?)\s*[.\n]?\s*מקור:\s*|([^\n.]+?)\s*[.\n]?\s*מקור:\s*|Source:\s*([^\n.]+?)\s*[.\n]?\s*From:\s*)?(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi;
      const foundMatches: SourceInfo[] = [];
      let match;

      while ((match = titleUrlPattern.exec(text)) !== null) {
        const title = (match[1] || match[2] || match[3] || '').trim();
        const url = match[4]?.trim();

        if (url) {
          try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            // Filter out homepage URLs - keep only URLs with paths
            if (path && path.length > 1 && path !== '/' && path !== '/index.html' && path !== '/index.php') {
              foundMatches.push({
                url: url,
                title: title || undefined
              });
            }
          } catch (e) {
            // Invalid URL, skip
          }
        }
      }

      // Also try to extract standalone URLs (if no title pattern matched)
      if (foundMatches.length === 0) {
        const urlPattern = /(?:Source:\s*|From:\s*|מקור:\s*)?(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi;
        const foundUrls = text.match(urlPattern) || [];
        foundUrls.forEach(url => {
          const cleanUrl = url.replace(/^(Source:\s*|From:\s*|מקור:\s*)/i, '').trim();
          try {
            const urlObj = new URL(cleanUrl);
            const path = urlObj.pathname;
            if (path && path.length > 1 && path !== '/' && path !== '/index.html' && path !== '/index.php') {
              foundMatches.push({
                url: cleanUrl,
                title: undefined
              });
            }
          } catch (e) {
            // Invalid URL, skip
          }
        });
      }

      // Also extract titles without URLs (standalone titles mentioned in the text)
      // Pattern: "כותרת: [title]" or numbered list like "1. [title]" or "- [title]"
      const standaloneTitlePattern = /(?:כותרת:\s*|^[0-9]+\.\s+|^[-•]\s+)([^\n.]+?)(?:\s*[.\n]|$)/gmi;
      const titleMatches = text.matchAll(standaloneTitlePattern);
      for (const titleMatch of titleMatches) {
        const title = titleMatch[1]?.trim();
        if (title && title.length > 5 && title.length < 200) {
          // Check if this title is not already in foundMatches
          const alreadyExists = foundMatches.some(m => m.title === title || m.url.includes(title));
          if (!alreadyExists) {
            // Add as title without URL - will search for URL automatically
            foundMatches.push({
              url: '', // Empty URL - will be searched automatically
              title: title
            });
          }
        }
      }

      if (foundMatches.length > 0) {
        setSources(prev => {
          const combined = [...prev, ...foundMatches];
          // Remove duplicates by URL
          const unique = combined.reduce((acc, current) => {
            if (!acc.find(item => item.url === current.url)) {
              acc.push(current);
            } else {
              // Update existing entry with title if available
              const existing = acc.find(item => item.url === current.url);
              if (current.title && !existing?.title) {
                existing!.title = current.title;
              }
            }
            return acc;
          }, [] as SourceInfo[]);
          return unique;
        });

        // For entries with title but no URL (or empty URL), search for the URL automatically
        const sourcesNeedingUrl = foundMatches.filter(s => s.title && (!s.url || s.url.length < 10));
        if (sourcesNeedingUrl.length > 0) {
          const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || '';
          const cx = process.env.GOOGLE_CUSTOM_SEARCH_CX || '';

          if (apiKey && cx) {
            // Search for URLs in parallel (but limit to 5 at a time to avoid rate limits)
            sourcesNeedingUrl.slice(0, 5).forEach(async (source) => {
              try {
                const searchQuery = source.title || '';
                if (!searchQuery || searchQuery.length < 3) return;

                const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(searchQuery)}&num=3&lr=lang_he|lang_en`;
                const response = await fetch(searchUrl);

                if (response.ok) {
                  const data = await response.json();
                  if (data.items && data.items.length > 0) {
                    // Find the best matching result (prefer articles with specific paths)
                    let bestResult = data.items[0];
                    for (const item of data.items) {
                      try {
                        const urlObj = new URL(item.link);
                        const path = urlObj.pathname;
                        // Prefer URLs with article paths (like /news/, /item/, /article/)
                        if (path && (path.includes('/news/') || path.includes('/item/') || path.includes('/article/'))) {
                          bestResult = item;
                          break;
                        }
                      } catch (e) {
                        // Invalid URL, continue
                      }
                    }

                    const foundUrl = bestResult.link;

                    if (foundUrl) {
                      try {
                        const urlObj = new URL(foundUrl);
                        const path = urlObj.pathname;
                        // Only update if URL has a valid path (not homepage)
                        if (path && path.length > 1 && path !== '/' && path !== '/index.html' && path !== '/index.php') {
                          // Update the source with the found URL
                          setSources(prevSources => {
                            return prevSources.map(s =>
                              s.title === source.title && (!s.url || s.url.length < 10)
                                ? { ...s, url: foundUrl }
                                : s
                            );
                          });
                        }
                      } catch (e) {
                        // Invalid URL, skip
                      }
                    }
                  }
                }
              } catch (err) {
                console.error('Failed to search for URL:', err);
              }
            });
          }
        }
      }
    }

    if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
        setStatus(AppStatus.SPEAKING);
        // Always decode and prepare audio, but only play if not muted
        const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
        const outputAudioContext = outputAudioContextRef.current;
        if (outputAudioContext) {
          // Check if assistant is muted right before playing
          if (!isAssistantMuted) {
            // Resume AudioContext if suspended (browser autoplay policy)
            if (outputAudioContext.state === 'suspended') {
              await outputAudioContext.resume();
            }

            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContext.destination);

            source.addEventListener('ended', () => {
              audioSourcesRef.current.delete(source);
            });

            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            audioSourcesRef.current.add(source);
          }
          // If muted, skip playing but still update timing to keep sync
          else {
            // Still decode to maintain timing, but don't play
            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
            nextStartTimeRef.current += audioBuffer.duration;
          }
        }
    }

    if (message.serverContent?.interrupted) {
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    }

    if (message.serverContent?.turnComplete) {
      updateTranscript(currentInputTranscriptionRef.current, currentOutputTranscriptionRef.current, true);
      currentTurnIdRef.current = null;
      currentInputTranscriptionRef.current = '';
      currentOutputTranscriptionRef.current = '';
      setStatus(AppStatus.LISTENING);
    }
  }, [isAssistantMuted, isCustomSearchEnabled, isSearchEnabled, updateTranscript, setSources, sources, fetchArticleContent]);

  const startConversation = useCallback(() => {
    if (status !== AppStatus.IDLE && status !== AppStatus.ERROR) return;

    // Note: isSearchEnabled state is used in the config below

    // Stop dictation mode if active
    if (isDictationModeRef.current && recognitionRef.current) {
      recognitionRef.current.stop();
      isDictationModeRef.current = false;
    }

    setStatus(AppStatus.CONNECTING);
    setError(null);
    setTranscript([]);

    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      console.log('🔑 API Key check:', {
        hasGEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
        hasAPI_KEY: !!process.env.API_KEY,
        apiKeyLength: apiKey ? apiKey.length : 0,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
        hostname: window.location.hostname
      });

      if (!apiKey || apiKey === '') {
        const errorMsg = 'GEMINI_API_KEY is not set. ' +
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'Please create a .env.local file with your Gemini API key.'
            : 'Please configure GEMINI_API_KEY in GitHub Secrets for deployment.');
        console.error('❌ API Key Error:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('✅ Initializing GoogleGenAI...');
      const ai = new GoogleGenAI({ apiKey: apiKey as string });

      // FIX: Add `(window as any)` to support `webkitAudioContext` in TypeScript for broader browser compatibility.
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // Get current date for dynamic date filtering
      const now = new Date();
      const currentDate = now.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });
      const currentYear = now.getFullYear();
      const currentMonth = now.toLocaleDateString('he-IL', { month: 'long' });
      const currentDay = now.getDate();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });

      console.log('🔍 Search configuration:', {
        isSearchEnabled,
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        hasGrounding: true
      });

      const configWithSearch = {
          responseModalities: [Modality.AUDIO],
          // הפרמטרים של inputAudioTranscription ו-outputAudioTranscription לא תקפים ב-Gemini Live API
          // השפה והתמלול נקבעים אוטומטית על ידי המודל או דרך systemInstruction
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        systemInstruction: `את עוזרת קולית ידידותית ומועילה עם חיפוש באינטרנט בזמן אמת. חשוב: המערכת מחפשת באינטרנט אוטומטית כשאת מזהה בקשות חיפוש. כשאת רואה הודעות כמו "[חיפוש בוצע - תוצאות זמינות מהיום ${currentDay} ${currentMonth} ${currentYear}]" עם תוצאות חיפוש, את חייבת להשתמש בתוצאות האלה בתגובה שלך.

CRITICAL - תמלול מדויק בעברית: כשאת מקבלת תמלול מהמשתמש, את חייבת לתמלל את כל המילים שהוא אמר בצורה מדויקת ומלאה. חשוב מאוד:

1. תמלול מילה במילה: תמיד תכתבי את כל המילים בדיוק כפי שהמשתמש אמר אותן. אל תדלגי על מילים, אל תחליפי מילים, ואל תקצרי משפטים. אם המשתמש אומר "תני לי בבקשה לינק לוויקיפדיה", תכתבי בדיוק "תני לי בבקשה לינק לוויקיפדיה" - לא "תן לי לינק" או "לינק לוויקיפדיה".

2. הבנת תמלול עם רווחים לא נכונים: לפעמים התמלול יכול להיות עם רווחים לא נכונים או מילים מפורקות (למשל "לי ב בק שה לינ ק" במקום "תני לי בבקשה לינק"), אבל את חייבת להבין את המשמעות המלאה של המשפט ולהציג את התמלול המתוקן. תמיד תפרשי את המשפט המלא כפי שהמשתמש התכוון - אם המשתמש אומר "תני לי בבקשה לינק לוויקיפדיה", תפרשי את זה כבקשה למסור לינק לוויקיפדיה, גם אם התמלול נכתב "לי ב בק שה לינ ק לויקיפדיה" או "תני לי ב בק שה לינק לוויקיפדיה". תקני את התמלול והציגי אותו בצורה נכונה.

3. תמלול מלא של משפטים: אל תחתכי משפטים באמצע - תמיד תחכי עד שהמשפט יהיה שלם לפני שתגיבי. אם המשתמש אומר משפט ארוך, תחכי עד שהוא מסיים את כל המשפט לפני שתעני. אל תפסיקי באמצע המשפט - תמיד תחכי לסימן הפיסוק או לסיום המשפט המלא.

4. תמלול מדויק של מילים בעברית: כשאת מקבלת תמלול בעברית, תמיד תכתבי את המילים בדיוק כפי שהן נשמעות. אם המשתמש אומר "ויקיפדיה", תכתבי "ויקיפדיה" - לא "ויקי" או "פדיה". אם המשתמש אומר "בבקשה", תכתבי "בבקשה" - לא "בבק" או "שה". תמיד תכתבי את המילים המלאות והמדויקות.

5. שמירה על סדר המילים: תמיד שמרי על הסדר הנכון של המילים במשפט. אם המשתמש אומר "תני לי בבקשה לינק לוויקיפדיה", תכתבי "תני לי בבקשה לינק לוויקיפדיה" - לא "לינק לי תני בבקשה ויקיפדיה".

6. תמלול של כל הביטויים: אם המשתמש אומר ביטוי או משפט מלא, תכתבי את כל הביטוי בדיוק. אל תקצרי ואל תדלגי על חלקים. אם המשתמש אומר "תני לי בבקשה לינק לוויקיפדיה", תכתבי את כל המשפט הזה - לא רק חלק ממנו.

CRITICAL - תשובות מלאות: תמיד תעני בצורה מלאה ומפורטת על כל בקשה של המשתמש. אל תפסיקי באמצע התשובה - תמיד סיימי את התשובה המלאה. אם המשתמש שואל שאלה, תעני עליה במלואה. אם המשתמש מבקש מידע, תני את כל המידע הרלוונטי. תמיד סיימי את התשובה שלך - אל תשאירי תשובות חלקיות.

הוראות קריטיות:
1. כשאת מקבלת תוצאות חיפוש בפורמט "כותרת X: [כותרת]. מקור: [URL]", את חייבת להשתמש בכותרות האלה בתגובה שלך מיד. אל תתעלמי מהן - החיפוש בוצע עבורך ואת חייבת להשתמש בתוצאות.
2. כשאת מציגה תוצאות חיפוש, תמיד תני את הכותרות האמיתיות מתוצאות החיפוש שקיבלת. פורמט: "כותרת: [הכותרת מהחיפוש]".

CRITICAL - איסור קריאת לינקים בקול: לעולם, בשום מקרה, בשום תנאי, אל תקריאי כתובת (URL) או לינק בקול! גם אם יש לינק בטקסט שלך, דלגי עליו לגמרי כשאת מקריאה בקול - רק תכתבי אותו בטקסט. אם המשתמש מבקש את הלינק או הכתובת (בכל דרך: "תשלחי לי את הלינק", "תן לי את הלינק", "תני לי לינק", "תן לי את הכתובת", "תני לי את הכתובת", "איפה אני יכול לקנות", "תשלחי לי את הכתובת", "תשלח לי את הלינק", "לינק", "לינ ק", "לינק לוויקיפדיה", "לינ ק לויקיפדיה", "תני לי לינק לוויקיפדיה", "תני לי ב בק שה לינק לוויקיפדיה", או כל בקשה שמזכירה "לינק", "לינ ק", "לינק", "link", "כתובת", "URL"), שלחי לו את ה-URL המלא בטקסט מיד - כתבי את הלינק המלא בתשובה שלך בדיוק כך: "הנה הלינק: https://example.com" או "הכתובת היא: https://example.com". המשתמש יראה אותו בטקסט ויוכל ללחוץ עליו. אבל כשאת מקריאה בקול - דלגי על הלינק לחלוטין! אל תגידי את הלינק בקול - אף לא מילה אחת מהלינק! חשוב: אל תגידי "הכתובת זמינה" או "הלינק זמין" - שלחי את הלינק המלא מיד!
3. התאריך היום הוא ${currentDate} (${currentDay} ${currentMonth} ${currentYear}) - ודאי שכל המידע הוא מהיום או מ-24-48 השעות האחרונות.
4. לעולם אל תשתמשי ב-placeholders - תמיד השתמשי בכותרות האמיתיות מתוצאות החיפוש.
5. אם את מקבלת תוצאות חיפוש, תני אותן מיד: "חיפשתי ומצאתי את הכותרות הבאות:" ואחר כך כל התוצאות האמיתיות לפי סדר ההופעה (תוצאה 1, תוצאה 2, תוצאה 3, וכו' עד תוצאה 10) - רק הכותרות, לא הכתובות. תמיד תני את הכותרות לפי הסדר שהגיעו מהחיפוש.
6. כשמשתמשים שואלים על חדשות או אירועים עדכניים, תמיד השתמשי בתוצאות החיפוש שסופקו לך. המערכת מחפשת אוטומטית כשצריך.
7. חשוב: כשאת רואה "[חיפוש בוצע - תוצאות זמינות מהיום ${currentDay} ${currentMonth} ${currentYear}]", עצרי והשתמשי בתוצאות האלה. אל תגידי שאת מחפשת - החיפוש כבר בוצע. פשוט תני את התוצאות - רק כותרות, לא כתובות.
8. קריטי - קריאת כתבות: כשאת מקבלת "[תוכן מאמר מהיום]", את חייבת לקרוא את כל התוכן מילה במילה בקול! אל תסכמי ואל תגידי "אני יכולה לקרוא רק חלק" - קראי את כל התוכן שמופיע. כשאת רואה "[תוכן מאמר מהיום - חלק X מתוך Y]", קראי את החלק הזה מילה במילה, ואחר כך תקבלי את החלק הבא.
9. כשמשתמשים מבקשים "כותרות מ-YNET" או "כותרות מ-ynet" או "מבזקים מ-וינט", חפשי כותרות מהאתר ynet.co.il ספציפית. התוצאות שתקבלי יכללו כותרות מהיום - השתמשי בהן בדיוק כפי שהן מופיעות, אבל רק את הכותרות, לא את הכתובות.

זכרי: תוצאות חיפוש מסופקות לך אוטומטית - השתמשי בהן ישירות בתגובות שלך. אם את רואה תוצאות חיפוש, את חייבת לכלול אותן בתשובה שלך - אבל רק כותרות, לא כתובות! אלא אם המשתמש מבקש את הלינק או הכתובת (בכל דרך, כולל עם רווחים לא נכונים) - אז שלחי לו את ה-URL המלא בטקסט מיד.

CRITICAL - איסור קריאת לינקים בקול: לעולם, בשום מקרה, בשום תנאי, אל תקריאי כתובת (URL) או לינק בקול! גם אם יש לינק בטקסט שלך, דלגי עליו לגמרי כשאת מקריאה בקול - רק תכתבי אותו בטקסט. אל תגידי את הלינק בקול - אף לא מילה אחת מהלינק!

CRITICAL - הבנת בקשות לינק: אם המשתמש מבקש לינק (בכל דרך: "לינק", "לינ ק", "תני לי לינק", "תן לי לינק", "תשלחי לי לינק", "תשלח לי לינק", "תני לי ב בק שה לינק", "תן לי ב בק שה לינק", "לינק לוויקיפדיה", "לינ ק לויקיפדיה", "תני לי לינק לוויקיפדיה", "תני לי ב בק שה לינק לוויקיפדיה", "תן לי לינק לוויקיפדיה", או כל בקשה שמזכירה "לינק", "לינ ק", "link", "כתובת", "URL"), את חייבת לשלוח את הלינק המלא מיד - לא רק להגיד שהוא זמין, אלא לכתוב אותו במלואו: "הנה הלינק: https://..." או "הכתובת היא: https://...". המשתמש יראה אותו בטקסט ויוכל ללחוץ עליו.

CRITICAL - איסור קריאת לינקים בקול: לעולם, בשום מקרה, בשום תנאי, אל תקריאי כתובת (URL) או לינק בקול! גם אם יש לינק בטקסט שלך, דלגי עליו לגמרי כשאת מקריאה בקול - רק תכתבי אותו בטקסט. אל תגידי את הלינק בקול - אף לא מילה אחת מהלינק! כשאת רואה לינק בטקסט - דלגי עליו לחלוטין בקריאה בקול!`,
      };

      // Enable Google Search grounding for real-time internet search (if enabled)
      if (isSearchEnabled) {
        (configWithSearch as any).groundingWithGoogleSearch = {
          enabled: true,
        };
        console.log('✅ Google Search Grounding ENABLED');
      } else {
        console.log('⚠️ Google Search Grounding DISABLED');
      }

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: configWithSearch as any,
        callbacks: {
          onopen: async () => {
            console.log('✅ WebSocket connection opened successfully');

            // סמן את ה-WebSocket כפתוח
            isWebSocketClosedRef.current = false;

            // Store the session reference immediately
            try {
              const session = await sessionPromiseRef.current;
              if (session && !isWebSocketClosedRef.current) {
                sessionRef.current = session;
                console.log('✅ Session stored in ref:', { hasSession: !!session });
              } else {
                console.warn('⚠️ Session not stored - WebSocket closed or session invalid');
                return;
              }
            } catch (err) {
              console.error('❌ Failed to store session:', err);
              isWebSocketClosedRef.current = true;
              return;
            }

            // וודא שה-WebSocket עדיין פתוח לפני שמתחילים לשלוח אודיו
            if (isWebSocketClosedRef.current) {
              console.warn('⚠️ WebSocket closed before audio setup - stopping');
              return;
            }

            setStatus(AppStatus.LISTENING);
            try {
            // Start streaming audio from microphone
              console.log('🎤 Requesting microphone access with high quality settings...');
              // Try to get high-quality audio stream with optimal settings for transcription
              let mediaStream: MediaStream;
              try {
                // First attempt: optimal settings for speech recognition
                mediaStream = await navigator.mediaDevices.getUserMedia({
                  audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000, // Optimal for speech recognition
                    channelCount: 1, // Mono for better transcription
                    sampleSize: 16
                  }
                });
                console.log('✅ High-quality microphone settings applied');
              } catch (err: any) {
                console.warn('⚠️ High-quality settings failed, trying basic settings:', err);
                // Fallback to basic audio if optimal settings fail
                try {
                  mediaStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                      echoCancellation: true,
                      noiseSuppression: true,
                      autoGainControl: true
                    }
                  });
                  console.log('✅ Basic microphone settings applied');
                } catch (fallbackErr: any) {
                  console.warn('⚠️ Basic settings failed, using minimal audio:', fallbackErr);
                  // Final fallback: minimal audio
                  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                }
              }

              // בדיקה נוספת אחרי קבלת המיקרופון
              if (isWebSocketClosedRef.current) {
                console.warn('⚠️ WebSocket closed after microphone access - stopping');
                mediaStream.getTracks().forEach(track => track.stop());
                return;
              }

              // Verify we have valid AudioContext and MediaStream
              if (!inputAudioContextRef.current) {
                throw new Error('AudioContext not initialized');
              }

              // Resume AudioContext if suspended (browser autoplay policy)
              if (inputAudioContextRef.current.state === 'suspended') {
                await inputAudioContextRef.current.resume();
              }

              if (!mediaStream || !mediaStream.getTracks().length) {
                throw new Error('Failed to get media stream');
              }

              // Verify MediaStream has active audio tracks
              const audioTracks = mediaStream.getAudioTracks();
              if (!audioTracks.length || audioTracks.every(track => track.readyState !== 'live')) {
                throw new Error('No active audio tracks in media stream');
              }

              mediaStreamRef.current = mediaStream;
              const source = inputAudioContextRef.current.createMediaStreamSource(mediaStream);
              scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);

            // איפוס flag שמסמן מתי האודיו יכול להתחיל להישלח
            audioProcessingEnabledRef.current = false;

            // הוסף delay קצר לפני שמתחילים לשלוח אודיו
            // זה נותן ל-WebSocket זמן להתחבר ולהתכונן
            setTimeout(() => {
              if (!isWebSocketClosedRef.current && sessionRef.current) {
                audioProcessingEnabledRef.current = true;
                console.log('✅ Audio processing enabled');
              } else {
                console.warn('⚠️ Audio processing not enabled - WebSocket closed or no session');
              }
            }, 500); // 500ms delay

            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
              // בדוק אם האודיו יכול להתחיל להישלח
              if (!audioProcessingEnabledRef.current) {
                return;
              }

              // בדוק אם ה-WebSocket עדיין פתוח - בדיקה ראשונה
              if (isWebSocketClosedRef.current) {
                audioProcessingEnabledRef.current = false;
                return;
              }

              // בדוק אם יש session זמין ב-ref (יותר מהיר)
              const currentSession = sessionRef.current;
              if (!currentSession) {
                // אם אין session ב-ref, אל תנסה לשלוח
                audioProcessingEnabledRef.current = false;
                return;
              }

              // בדיקה נוספת לפני השליחה - וודא שה-WebSocket עדיין פתוח
              if (isWebSocketClosedRef.current) {
                audioProcessingEnabledRef.current = false;
                return;
              }

              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };

              // נסה לשלוח דרך session ב-ref (יש לנו אותו כי בדקנו קודם)
              try {
                // בדיקה אחרונה לפני השליחה
                if (isWebSocketClosedRef.current) {
                  return;
                }
                currentSession.sendRealtimeInput({ media: pcmBlob });
              } catch (err: any) {
                // אם ה-WebSocket נסגר, סמן אותו כסגור והפסק את העיבוד
                if (err?.message?.includes('CLOSING') || err?.message?.includes('CLOSED') ||
                    err?.message?.includes('WebSocket') || err?.name === 'InvalidStateError') {
                  // סמן את ה-WebSocket כסגור והפסק את עיבוד האודיו
                  isWebSocketClosedRef.current = true;
                  audioProcessingEnabledRef.current = false;
                  // הפסק את עיבוד האודיו
                  if (scriptProcessorRef.current) {
                    try {
                      scriptProcessorRef.current.disconnect();
                    } catch (disconnectErr) {
                      // אל תדפיס שגיאה - זה תקין
                    }
                    scriptProcessorRef.current = null;
                  }
                  // אל תדפיס שגיאה - זה תקין שהקשר נסגר
                  return;
                }
                // אם זו שגיאה אחרת, דפיס אותה
                console.error('❌ [Audio] שגיאה בשליחת אודיו:', err);
              }
            };
            source.connect(scriptProcessorRef.current);
              scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
            } catch (error: any) {
              console.error('❌ Error setting up audio:', error);
              console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
              });
              setError(`שגיאה בהגדרת המיקרופון: ${error.message || 'שגיאה לא ידועה'}. בדוק את הקונסול (F12) לפרטים נוספים.`);
              setStatus(AppStatus.ERROR);
              cleanup();
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            handleServerMessage(message);
          },
          onerror: (e: ErrorEvent) => {
            console.error('❌ API Error:', e);
            console.error('Error details:', {
              message: e.message,
              error: e.error,
              type: e.type,
              filename: e.filename,
              lineno: e.lineno,
              colno: e.colno
            });
            // סמן את ה-WebSocket כסגור
            isWebSocketClosedRef.current = true;
            setError(`שגיאת חיבור ל-API: ${e.message || 'שגיאה לא ידועה'}. בדוק את הקונסול (F12) לפרטים נוספים.`);
            setStatus(AppStatus.ERROR);
            cleanup();
          },
          onclose: (event: CloseEvent) => {
            console.log('🔌 WebSocket connection closed', {
              code: event?.code,
              reason: event?.reason,
              wasClean: event?.wasClean
            });
            // סמן את ה-WebSocket כסגור
            isWebSocketClosedRef.current = true;
            audioProcessingEnabledRef.current = false;
            // רק נקרא cleanup אם זה לא סגירה תקינה (code 1000)
            // אם זה סגירה תקינה, אולי זה חלק מתהליך הרגיל
            if (event?.code !== 1000) {
              console.warn('⚠️ WebSocket closed unexpectedly:', event?.code, event?.reason);
              cleanup();
            }
          },
        },
      });

      console.log('✅ Session connection initiated');
    } catch (error: any) {
      console.error('❌ Failed to start conversation:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      setError(`שגיאה בהתחלת השיחה: ${error.message || 'שגיאה לא ידועה'}. בדוק את הקונסול (F12) לפרטים נוספים.`);
        setStatus(AppStatus.ERROR);
    }
  }, [status, isSearchEnabled, isCustomSearchEnabled, handleServerMessage]);

  const stopConversation = useCallback(() => {
    // סמן את ה-WebSocket כסגור מיד
    isWebSocketClosedRef.current = true;
    audioProcessingEnabledRef.current = false;

    // Stop dictation mode if active
    if (isDictationModeRef.current && recognitionRef.current) {
      recognitionRef.current.stop();
      isDictationModeRef.current = false;
    }

    // Close session from ref first
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
        console.log('✅ Session closed from ref');
      } catch (err) {
        console.error('❌ Error closing session:', err);
      }
      sessionRef.current = null;
    }

    // Also close from promise
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        try {
          session.close();
        } catch (err) {
          console.error('❌ Error closing session from promise:', err);
        }
      }).catch(() => {});
      sessionPromiseRef.current = null;
    }
    cleanup();
  }, []);

  const cleanup = useCallback(() => {
    // סמן את ה-WebSocket כסגור
    isWebSocketClosedRef.current = true;
    audioProcessingEnabledRef.current = false;

    // Stop dictation mode
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Recognition might already be stopped
      }
      recognitionRef.current = null;
    }
    isDictationModeRef.current = false;

    setStatus(AppStatus.IDLE);

    // Stop microphone stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close();
    }

    // Stop playback
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        outputAudioContextRef.current.close();
    }

    nextStartTimeRef.current = 0;
    currentTurnIdRef.current = null;
    currentInputTranscriptionRef.current = '';
    currentOutputTranscriptionRef.current = '';
  }, []);

  const saveHistoryToFile = useCallback(() => {
    try {
      const dataStr = JSON.stringify(transcript, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gemini-chat-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to save history to file:', err);
      throw new Error('Failed to save history to file');
    }
  }, [transcript]);

  const saveHistoryToTxt = useCallback(() => {
    try {
      if (transcript.length === 0) {
        throw new Error('No conversation history to export');
      }

      let textContent = '';

      transcript.forEach((turn, index) => {
        // Only include user text, no assistant responses, no labels
        if (turn.user.trim()) {
          textContent += turn.user.trim();
          // Add newline between turns (except for the last one)
          if (index < transcript.length - 1) {
            textContent += '\n\n';
          }
        }
      });

      const dataBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gemini-chat-text-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to save history to TXT:', err);
      throw new Error('Failed to save history to TXT file');
    }
  }, [transcript]);

  const clearHistory = useCallback(() => {
    setTranscript([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear saved history:', err);
    }
  }, []);

  const loadHistoryFromFile = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            setTranscript(parsed);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            resolve();
          } else {
            reject(new Error('Invalid file format'));
          }
        } catch (err) {
          reject(new Error('Failed to parse file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  // State for text-to-speech
  const [isReading, setIsReading] = useState(false);
  const [readingProgress, setReadingProgress] = useState<{ current: number; total: number } | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const pausedPositionRef = useRef<number>(0); // Store position when paused
  const readingTextRef = useRef<string>(''); // Store text being read

  const pauseReading = useCallback(() => {
    if (speechSynthesisRef.current && speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  const resumeReading = useCallback(() => {
    if (speechSynthesisRef.current && speechSynthesisRef.current.paused) {
      speechSynthesisRef.current.resume();
      setIsPaused(false);
    }
  }, []);

  const readHistoryAloud = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    if (transcript.length === 0) {
      alert('אין היסטוריה להקראה. נסה לטעון קובץ היסטוריה קודם.');
      return;
    }

    // Resume if paused
    if (isPaused && speechSynthesisRef.current) {
      resumeReading();
      return;
    }

    // Stop any ongoing speech
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }

    speechSynthesisRef.current = window.speechSynthesis;

    // Combine all messages into one text
    const fullText = transcript
      .map(turn => {
        const userText = turn.user ? `משתמש: ${turn.user}` : '';
        const assistantText = turn.assistant ? `עוזר: ${turn.assistant}` : '';
        return [userText, assistantText].filter(Boolean).join('\n');
      })
      .filter(Boolean)
      .join('\n\n');

    if (!fullText.trim()) {
      alert('אין תוכן קריא בהיסטוריה.');
      return;
    }

    readingTextRef.current = fullText;
    setIsReading(true);
    setIsPaused(false);
    setReadingProgress({ current: 0, total: fullText.length });

    const utterance = new SpeechSynthesisUtterance(fullText);
    currentUtteranceRef.current = utterance;

    // Configure voice
    const voices = speechSynthesisRef.current.getVoices();
    const preferredVoices = voices.filter(v =>
      v.lang.includes('he') || v.lang.includes('en') || v.name.includes('Google')
    );
    if (preferredVoices.length > 0) {
      utterance.voice = preferredVoices[0];
    }
    utterance.lang = 'he-IL';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Track progress
    utterance.onboundary = (event) => {
      if (event.charIndex !== undefined) {
        setReadingProgress({ current: event.charIndex, total: fullText.length });
      }
    };

    utterance.onend = () => {
      setIsReading(false);
      setIsPaused(false);
      setReadingProgress(null);
      currentUtteranceRef.current = null;
      readingTextRef.current = '';
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsReading(false);
      setIsPaused(false);
      setReadingProgress(null);
      currentUtteranceRef.current = null;
      alert('שגיאה בהקראה. נסה שוב.');
    };

    speechSynthesisRef.current.speak(utterance);
  }, [transcript, isPaused, resumeReading]);

  const stopReading = useCallback(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsReading(false);
      setIsPaused(false);
      setReadingProgress(null);
      currentUtteranceRef.current = null;
      pausedPositionRef.current = 0;
      readingTextRef.current = '';
    }
  }, []);

  const readTextFile = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    if (!text.trim()) {
      alert('No text to read.');
      return;
    }

    // Stop any ongoing speech
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }

    speechSynthesisRef.current = window.speechSynthesis;

    setIsReading(true);

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtteranceRef.current = utterance;

    // Configure voice
    const voices = speechSynthesisRef.current.getVoices();
    const preferredVoices = voices.filter(v =>
      v.lang.includes('he') || v.lang.includes('en') || v.name.includes('Google')
    );
    if (preferredVoices.length > 0) {
      utterance.voice = preferredVoices[0];
    }
    utterance.lang = 'he-IL';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setIsReading(false);
      currentUtteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsReading(false);
      currentUtteranceRef.current = null;
      alert('Error reading text. Please try again.');
    };

    speechSynthesisRef.current.speak(utterance);
  }, []);

  const loadTextFile = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          if (content && content.trim()) {
            resolve();
          } else {
            reject(new Error('File is empty'));
          }
        } catch (err) {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  // Function to fetch article title from URL
  const fetchArticleTitle = useCallback(async (url: string): Promise<string | null> => {
    try {
      // Use a CORS proxy or API to fetch the page
      // For security reasons, we'll use an API endpoint
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();

      if (data.contents) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        const title = doc.querySelector('title')?.textContent ||
                     doc.querySelector('h1')?.textContent ||
                     doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                     'No title found';
        return title.trim();
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch article title:', err);
      return null;
    }
  }, []);

  // Function to read article titles aloud
  const readArticleTitles = useCallback(async () => {
    if (sources.length === 0) {
      alert('אין מקורות מאמרים. שאל על חדשות עדכניות קודם.');
      return;
    }

    // Resume if paused
    if (isPaused && speechSynthesisRef.current) {
      resumeReading();
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    // Stop any ongoing speech
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }

    speechSynthesisRef.current = window.speechSynthesis;
    setIsReading(true);
    setIsPaused(false);

    // Wait for voices to be loaded
    const loadVoices = () => {
      return new Promise<void>((resolve) => {
        const voices = speechSynthesisRef.current?.getVoices() || [];
        if (voices.length > 0) {
          resolve();
        } else {
          speechSynthesisRef.current?.addEventListener('voiceschanged', () => resolve(), { once: true });
          // Fallback timeout
          setTimeout(() => resolve(), 1000);
        }
    });
  };

    await loadVoices();

    let titlesText = 'כותרות מאמרים:\n\n';
    let successCount = 0;

    // Fetch titles with better error handling
    for (const source of sources.slice(0, 10)) { // Limit to 10 articles
      try {
        // If title already exists, use it; otherwise fetch it
        let title = source.title;
        if (!title) {
          title = await fetchArticleTitle(source.url);
        }
        if (title && title.trim() && title !== 'No title found') {
          titlesText += `${successCount + 1}. ${title.trim()}\n\n`;
          successCount++;
        }
      } catch (err) {
        console.error(`Failed to fetch title for ${source.url}:`, err);
        // Continue to next article
      }
    }

    if (successCount === 0) {
      alert('לא הצלחתי להביא כותרות. נסה שוב או בדוק את הקונסול (F12) לפרטים נוספים.');
      setIsReading(false);
      return;
    }

    readingTextRef.current = titlesText;
    setReadingProgress({ current: 0, total: titlesText.length });

    const utterance = new SpeechSynthesisUtterance(titlesText);
    currentUtteranceRef.current = utterance;

    const voices = speechSynthesisRef.current.getVoices();
    const preferredVoices = voices.filter(v =>
      v.lang.includes('he') || v.lang.includes('en') || v.name.includes('Google') || v.name.includes('Microsoft')
    );
    if (preferredVoices.length > 0) {
      utterance.voice = preferredVoices[0];
    }
    utterance.lang = 'he-IL';
    utterance.rate = 0.85; // Slightly slower for better comprehension
    utterance.pitch = 1;
    utterance.volume = 1;

    // Track progress
    utterance.onboundary = (event) => {
      if (event.charIndex !== undefined) {
        setReadingProgress({ current: event.charIndex, total: titlesText.length });
      }
    };

    utterance.onend = () => {
      setIsReading(false);
      setIsPaused(false);
      setReadingProgress(null);
      currentUtteranceRef.current = null;
      readingTextRef.current = '';
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsReading(false);
      setIsPaused(false);
      setReadingProgress(null);
      currentUtteranceRef.current = null;
      alert('שגיאה בהקראת הכותרות. נסה שוב.');
    };

    try {
      speechSynthesisRef.current.speak(utterance);
    } catch (err) {
      console.error('Failed to speak:', err);
      setIsReading(false);
      setIsPaused(false);
      setReadingProgress(null);
      alert('שגיאה בהקראת הכותרות. נסה שוב.');
    }
  }, [sources, fetchArticleTitle, isPaused, resumeReading]);

  // Function to read full article from URL
  const readFullArticle = useCallback(async (url: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    // Check if URL is valid article URL (not just homepage)
    if (!url || url.trim().length === 0) {
      alert('כתובת לא תקינה. יש לוודא שה-URL הוא כתובת ספציפית של כתבה.');
      return;
    }

    // Resume if paused
    if (isPaused && speechSynthesisRef.current) {
      resumeReading();
      return;
    }

    // Stop any ongoing speech
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }

    speechSynthesisRef.current = window.speechSynthesis;
    setIsReading(true);
    setIsPaused(false);

    // Wait for voices to be loaded
    const loadVoices = () => {
      return new Promise<void>((resolve) => {
        const voices = speechSynthesisRef.current?.getVoices() || [];
        if (voices.length > 0) {
          resolve();
        } else {
          speechSynthesisRef.current?.addEventListener('voiceschanged', () => resolve(), { once: true });
          // Fallback timeout
          setTimeout(() => resolve(), 1000);
        }
      });
    };

    await loadVoices();

    // Show loading message
    console.log(`Fetching article from: ${url}`);

    try {
      const content = await fetchArticleContent(url);
      if (!content || content.length < 50) {
        alert('לא הצלחתי להביא את תוכן הכתבה. זה יכול לקרות אם:\n1. הכתובת היא רק דף בית ולא כתבה ספציפית\n2. האתר חוסם גישה אוטומטית\n3. יש בעיה ברשת\n\nנסה לשאול שוב את השאלה כדי לקבל כתובת ספציפית של כתבה.');
        setIsReading(false);
        return;
      }

      console.log(`Article content fetched: ${content.length} characters`);

      readingTextRef.current = content;
      setReadingProgress({ current: 0, total: content.length });

      // Split long content into chunks to avoid issues
      const chunks = content.match(/.{1,10000}/g) || [content];
      let currentChunkIndex = 0;
      let totalCharsRead = 0;

      const readNextChunk = () => {
        if (currentChunkIndex >= chunks.length) {
          setIsReading(false);
          setIsPaused(false);
          setReadingProgress(null);
          currentUtteranceRef.current = null;
          readingTextRef.current = '';
          return;
        }

        const chunk = chunks[currentChunkIndex];
        const utterance = new SpeechSynthesisUtterance(chunk);
        currentUtteranceRef.current = utterance;

        const voices = speechSynthesisRef.current?.getVoices() || [];
        const preferredVoices = voices.filter(v =>
          v.lang.includes('he') || v.lang.includes('en') || v.name.includes('Google') || v.name.includes('Microsoft')
        );
        if (preferredVoices.length > 0) {
          utterance.voice = preferredVoices[0];
        }
        utterance.lang = 'he-IL';
        utterance.rate = 0.85; // Slightly slower for better comprehension
        utterance.pitch = 1;
        utterance.volume = 1;

        // Track progress
        utterance.onboundary = (event) => {
          if (event.charIndex !== undefined) {
            const currentPos = totalCharsRead + event.charIndex;
            setReadingProgress({ current: currentPos, total: content.length });
          }
        };

        utterance.onend = () => {
          totalCharsRead += chunk.length;
          currentChunkIndex++;
          readNextChunk();
        };

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          setIsReading(false);
          setIsPaused(false);
          setReadingProgress(null);
          currentUtteranceRef.current = null;
          alert('שגיאה בהקראת הכתבה. נסה שוב.');
        };

        if (speechSynthesisRef.current) {
          try {
            speechSynthesisRef.current.speak(utterance);
          } catch (err) {
            console.error('Failed to speak:', err);
            setIsReading(false);
            setIsPaused(false);
            setReadingProgress(null);
            alert('שגיאה בהקראת הכתבה. נסה שוב.');
          }
        }
      };

      readNextChunk();
    } catch (err) {
      console.error('Failed to read article:', err);
      alert('שגיאה בהקראת הכתבה. נסה שוב או בדוק את הקונסול (F12) לפרטים נוספים.');
      setIsReading(false);
    }
  }, [fetchArticleContent, isPaused, resumeReading]);

  // Function to send text message manually to the model
  const sendTextMessage = useCallback(async (text: string): Promise<boolean> => {
    if (!text || text.trim().length === 0) {
      console.warn('⚠️ [שליחת טקסט] טקסט ריק');
      return false;
    }

    // Get session
    let session = sessionRef.current;
    if (!session && sessionPromiseRef.current) {
      try {
        session = await sessionPromiseRef.current;
        sessionRef.current = session;
      } catch (err) {
        console.error('❌ [שליחת טקסט] שגיאה בקבלת session:', err);
        return false;
      }
    }

    if (!session) {
      console.warn('⚠️ [שליחת טקסט] אין session זמין - השיחה לא פעילה');
      return false;
    }

    try {
      console.log('📤 [שליחת טקסט] שולח טקסט למודל:', text.substring(0, 100));

      // Check if this is a search request and trigger search if needed
      const searchKeywords = ['חדשות', 'מבזקים', 'חיפוש', 'מחפש', 'חדש', 'היום', 'עדכני', 'news', 'search', 'מה קורה', 'מה המצב', 'כותרות', 'כותרת', 'ynet', 'וינט', 'יי נט', 'why net', 'כותרת ראשית', 'כתבה ראשית', 'מה חדש', 'מה קרה', 'חדשות היום', 'מה המצב', 'מה קורה בעולם', 'מה חדש בעולם', 'חדשות ישראל', 'מה קורה בישראל'];
      const isSearchRequest = searchKeywords.some(keyword =>
        text.toLowerCase().includes(keyword.toLowerCase())
      );

      const newsKeywords = ['כותרות', 'כותרת', 'ynet', 'וינט', 'יי נט', 'why net', 'כותרת ראשית', 'כתבה ראשית', 'מה חדש', 'מה קרה', 'חדשות היום', 'מבזקים', 'חדשות', 'מה המצב', 'מה קורה'];
      const isNewsRequest = newsKeywords.some(keyword =>
        text.toLowerCase().includes(keyword.toLowerCase())
      );

      const shouldSearch = isNewsRequest || isSearchRequest;

      // If it's a search request, trigger search first
      if (shouldSearch && (isCustomSearchEnabled || isSearchEnabled)) {
        const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || '';
        const cx = process.env.GOOGLE_CUSTOM_SEARCH_CX || '';

        if (apiKey && cx) {
          console.log('🔍 [שליחת טקסט] מזהה בקשה לחיפוש - מתחיל חיפוש...');
          const searchConfig: SearchConfig = {
            apiKey,
            cx,
            session,
            sessionPromise: sessionPromiseRef.current
          };

          // Perform search in parallel (don't await)
          searchAndSendToModel(text.trim(), searchConfig).catch(err => {
            console.error('❌ [שליחת טקסט] שגיאה בחיפוש:', err);
          });
        }
      }

      // Send text to model
      session.sendRealtimeInput({
        text: text.trim()
      });

      console.log('✅ [שליחת טקסט] טקסט נשלח למודל בהצלחה!');
      return true;
    } catch (error: any) {
      console.error('❌ [שליחת טקסט] שגיאה בשליחת טקסט:', error);
      return false;
    }
  }, [isCustomSearchEnabled, isSearchEnabled]);

  // Function to search using Google Custom Search API
  const searchWithCustomSearch = useCallback(async (query: string): Promise<{ title: string; link: string; snippet: string }[]> => {
    const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || '';
    const cx = process.env.GOOGLE_CUSTOM_SEARCH_CX || '';

    if (!apiKey || !cx) {
      console.warn('Google Custom Search API key or CX not configured');
      return [];
    }

    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=10&lr=lang_he|lang_en`;
      const response = await fetch(url);

      if (!response.ok) {
        console.error('Custom Search API error:', response.status, response.statusText);
        return [];
      }

      const data = await response.json();

      if (data.items && Array.isArray(data.items)) {
        return data.items.map((item: any) => ({
          title: item.title || '',
          link: item.link || '',
          snippet: item.snippet || ''
        }));
      }

      return [];
    } catch (err) {
      console.error('Failed to search with Custom Search API:', err);
      return [];
    }
  }, []);

  return {
    status,
    transcript,
    error,
    isSearchEnabled,
    setIsSearchEnabled,
    isCustomSearchEnabled,
    setIsCustomSearchEnabled,
    isAssistantMuted,
    setIsAssistantMuted,
    searchStatus,
    apiConnectionStatus,
    lastSearchTime,
    startConversation,
    startDictationOnly,
    stopConversation,
    saveHistoryToFile,
    saveHistoryToTxt,
    clearHistory,
    loadHistoryFromFile,
    readHistoryAloud,
    pauseReading,
    resumeReading,
    stopReading,
    isReading,
    isPaused,
    readingProgress,
    readTextFile,
    loadTextFile,
    searchWithCustomSearch,
    sendTextMessage
  };
};

