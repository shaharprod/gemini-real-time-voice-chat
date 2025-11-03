
import React, { useState } from 'react';
import { useVoiceChat } from './hooks/useVoiceChat';
import { AppStatus } from './types';
import { MicrophoneIcon, StopIcon, DownloadIcon, UploadIcon, TrashIcon, SpeakerIcon, DictationIcon, FileTextIcon, SearchIcon, NewsIcon, PauseIcon, PlayIcon, VolumeXIcon, Volume2Icon } from './components/Icons';
import { StatusIndicator } from './components/StatusIndicator';
import { Transcript } from './components/Transcript';

const App: React.FC = () => {
  const { 
    status, 
    transcript, 
    error,
    sources,
    isSearchEnabled,
    setIsSearchEnabled,
    isAssistantMuted,
    setIsAssistantMuted,
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
    readArticleTitles,
    readFullArticle
  } = useVoiceChat();
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const textFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleStart = async () => {
    try {
      // Check for microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      setPermissionError(null);
      startConversation();
    } catch (err) {
      console.error("Microphone permission denied:", err);
      setPermissionError("Microphone permission is required to use this application. Please allow access in your browser settings.");
      setHasPermission(false);
    }
  };

  const handleStartDictation = async () => {
    try {
      // Check for microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      setPermissionError(null);
      startDictationOnly();
    } catch (err) {
      console.error("Microphone permission denied:", err);
      setPermissionError("Microphone permission is required to use this application. Please allow access in your browser settings.");
      setHasPermission(false);
    }
  };

  const isConversationActive = status !== AppStatus.IDLE && status !== AppStatus.ERROR && status !== AppStatus.TRANSCRIBING;
  const isDictationActive = status === AppStatus.TRANSCRIBING;

  const handleSaveHistory = () => {
    try {
      saveHistoryToFile();
    } catch (err) {
      console.error('Failed to save history:', err);
      alert('Failed to save history. Please try again.');
    }
  };

  const handleSaveHistoryToTxt = () => {
    try {
      saveHistoryToTxt();
    } catch (err) {
      console.error('Failed to save history to TXT:', err);
      alert('Failed to save history to TXT. Please try again.');
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all conversation history?')) {
      clearHistory();
    }
  };

  const handleLoadHistory = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      loadHistoryFromFile(file)
        .then(() => {
          alert('History loaded successfully!');
        })
        .catch((err) => {
          console.error('Failed to load history:', err);
          alert('Failed to load history. Please make sure the file is a valid JSON file.');
        });
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReadAloud = () => {
    if (isPaused) {
      resumeReading();
    } else if (isReading) {
      pauseReading();
    } else {
      readHistoryAloud();
    }
  };

  const handleLoadTextFile = () => {
    textFileInputRef.current?.click();
  };

  const handleTextFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          if (content && content.trim()) {
            readTextFile(content);
          } else {
            alert('File is empty or could not be read.');
          }
        } catch (err) {
          console.error('Failed to read text file:', err);
          alert('Failed to read text file. Please make sure the file is a valid text file.');
        }
      };
      reader.onerror = () => {
        alert('Failed to read file.');
      };
      reader.readAsText(file);
      // Reset input
      if (textFileInputRef.current) {
        textFileInputRef.current.value = '';
      }
    }
  };

  const handleReadArticleTitles = async () => {
    if (sources.length === 0) {
      alert('אין מקורות מאמרים. שאל על חדשות עדכניות קודם.');
      return;
    }
    await readArticleTitles();
  };

  const handleReadFullArticle = async (url: string) => {
    await readFullArticle(url);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl h-[90vh] flex flex-col bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <header className="flex-shrink-0 p-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-gray-200">Gemini Voice Assistant</h1>
            <p className="text-xs text-gray-400 mt-1">עוזר קולי עם חיפוש בזמן אמת</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusIndicator status={status} />
            <button
              onClick={() => setIsSearchEnabled(!isSearchEnabled)}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-colors ${
                isSearchEnabled
                  ? 'bg-blue-900/30 border-blue-700/50 hover:bg-blue-900/50'
                  : 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50'
              }`}
              title={isSearchEnabled ? "כיבוי חיפוש בזמן אמת" : "הפעלת חיפוש בזמן אמת"}
            >
              <SearchIcon className={`w-4 h-4 ${isSearchEnabled ? 'text-blue-400' : 'text-gray-500'}`} />
              <span className={`text-xs font-medium ${isSearchEnabled ? 'text-blue-300' : 'text-gray-400'}`}>
                {isSearchEnabled ? 'חיפוש פעיל' : 'חיפוש כבוי'}
              </span>
            </button>
            <button
              onClick={() => setIsAssistantMuted(!isAssistantMuted)}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-colors ${
                !isAssistantMuted
                  ? 'bg-green-900/30 border-green-700/50 hover:bg-green-900/50'
                  : 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50'
              }`}
              title={isAssistantMuted ? "הפעלת קול האסיסטנט" : "השתקת האסיסטנט"}
            >
              {!isAssistantMuted ? (
                <Volume2Icon className="w-4 h-4 text-green-400" />
              ) : (
                <VolumeXIcon className="w-4 h-4 text-gray-500" />
              )}
              <span className={`text-xs font-medium ${!isAssistantMuted ? 'text-green-300' : 'text-gray-400'}`}>
                {!isAssistantMuted ? 'קול פעיל' : 'מושתק'}
              </span>
            </button>
            <div className="flex gap-3 ml-4 flex-wrap">
              <button
                onClick={handleSaveHistory}
                disabled={transcript.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="שמור היסטוריה לקובץ JSON"
              >
                <DownloadIcon className="w-5 h-5" />
                <span className="text-xs">שמור JSON</span>
              </button>
              <button
                onClick={handleSaveHistoryToTxt}
                disabled={transcript.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-blue-300 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="ייצא שיחה לקובץ TXT"
              >
                <FileTextIcon className="w-5 h-5" />
                <span className="text-xs">ייצא TXT</span>
              </button>
              <button
                onClick={handleLoadHistory}
                className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
                title="טען היסטוריה מקובץ JSON"
              >
                <UploadIcon className="w-5 h-5" />
                <span className="text-xs">טען JSON</span>
              </button>
              <button
                onClick={handleLoadTextFile}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isReading 
                    ? 'text-purple-400 hover:text-purple-300 hover:bg-gray-700 bg-purple-900/30' 
                    : 'text-gray-400 hover:text-purple-300 hover:bg-gray-700'
                }`}
                title={isReading ? "עצור הקראה" : "טען והקרא קובץ טקסט"}
              >
                <SpeakerIcon className="w-5 h-5" />
                <span className="text-xs">{isReading ? 'עצור' : 'הקרא קובץ'}</span>
              </button>
              {/* Reading Control Buttons */}
              {isReading && (
                <>
                  {isPaused ? (
                    <button
                      onClick={resumeReading}
                      className="flex items-center gap-2 px-3 py-2 text-green-400 hover:text-green-300 hover:bg-gray-700 rounded-lg transition-colors"
                      title="המשך הקראה"
                    >
                      <PlayIcon className="w-5 h-5" />
                      <span className="text-xs">המשך</span>
                    </button>
                  ) : (
                    <button
                      onClick={pauseReading}
                      className="flex items-center gap-2 px-3 py-2 text-yellow-400 hover:text-yellow-300 hover:bg-gray-700 rounded-lg transition-colors"
                      title="השהה הקראה"
                    >
                      <PauseIcon className="w-5 h-5" />
                      <span className="text-xs">השהה</span>
                    </button>
                  )}
                  <button
                    onClick={stopReading}
                    className="flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-lg transition-colors"
                    title="עצור הקראה"
                  >
                    <StopIcon className="w-5 h-5" />
                    <span className="text-xs">עצור</span>
                  </button>
                </>
              )}
              {!isReading && (
                <button
                  onClick={handleReadAloud}
                  disabled={transcript.length === 0}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  }`}
                  title="הקרא היסטוריה בקול"
                >
                  <SpeakerIcon className="w-5 h-5" />
                  <span className="text-xs">הקרא היסטוריה</span>
                </button>
              )}
              <button
                onClick={handleReadArticleTitles}
                disabled={sources.length === 0 || isReading}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isReading
                    ? 'bg-orange-900/30 border-orange-700/50 text-orange-300 hover:bg-orange-900/50'
                    : sources.length > 0
                    ? 'bg-orange-900/20 border-orange-700/30 text-orange-400 hover:bg-orange-900/30 hover:border-orange-700/50'
                    : 'bg-gray-700/30 border-gray-600/30 text-gray-500'
                }`}
                title={sources.length === 0 ? "לא נמצאו מקורות מאמרים" : "הקרא כותרות מאמרים"}
              >
                <NewsIcon className="w-5 h-5" />
                <span className="text-xs font-medium">{sources.length === 0 ? 'אין מאמרים' : 'הקרא כותרות'}</span>
              </button>
              <button
                onClick={handleClearHistory}
                disabled={transcript.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="נקה היסטוריה"
              >
                <TrashIcon className="w-5 h-5" />
                <span className="text-xs">נקה</span>
              </button>
            </div>
          </div>
        </header>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelected}
          style={{ display: 'none' }}
        />
        <input
          ref={textFileInputRef}
          type="file"
          accept=".txt,.text"
          onChange={handleTextFileSelected}
          style={{ display: 'none' }}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Reading Progress */}
          {isReading && readingProgress && (
            <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-blue-300 font-medium">
                  {isPaused ? 'הקראה מושהה' : 'קורא...'}
                </span>
                <span className="text-xs text-blue-300/70">
                  {Math.round((readingProgress.current / readingProgress.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(readingProgress.current / readingProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <Transcript transcript={transcript} />
          
          {sources.length > 0 ? (
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <NewsIcon className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-blue-300">מקורות מאמרים ({sources.length})</h3>
              </div>
              <p className="text-xs text-blue-300/70 mb-3">
                לחץ על "הקרא" ליד כל כתבה כדי להקשיב לתוכן המלא
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sources.slice(0, 10).map((url, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors">
                    <span className="text-xs text-gray-400 flex-1 truncate" title={url}>{url}</span>
                    <button
                      onClick={() => handleReadFullArticle(url)}
                      disabled={isReading}
                      className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isReading
                          ? 'bg-orange-900/30 border-orange-700/50 text-orange-300'
                          : 'bg-orange-900/20 border-orange-700/30 text-orange-400 hover:bg-orange-900/30 hover:border-orange-700/50'
                      }`}
                      title="הקרא כתבה מלאה"
                    >
                      <SpeakerIcon className="w-4 h-4" />
                      <span className="font-medium">{isReading ? 'קורא...' : 'הקרא'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            transcript.length > 0 && transcript.some(t => t.assistant.toLowerCase().includes('מקור') || t.assistant.toLowerCase().includes('source') || t.assistant.toLowerCase().includes('wall') || t.assistant.toLowerCase().includes('ynet')) && (
              <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <NewsIcon className="w-5 h-5 text-yellow-400" />
                  <h3 className="font-semibold text-yellow-300">אין כתובות מאמרים זמינות</h3>
                </div>
                <p className="text-xs text-yellow-300/70">
                  המערכת לא מצאה כתובות ספציפיות של מאמרים בתשובה. נסה לשאול שוב: "תן לי את הכתובות הספציפיות של המאמרים" או "מה הכתובות המלאות של הכתבות?"
                </p>
              </div>
            )
          )}
          
          {permissionError && (
             <div className="mt-4 p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">
                <p className="font-semibold">Permission Error</p>
                <p>{permissionError}</p>
             </div>
          )}
          {error && (
            <div className="mt-4 p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">
              <p className="font-semibold">An Error Occurred</p>
              <p>{error}</p>
            </div>
          )}
        </main>
        
        <footer className="flex-shrink-0 p-6 bg-gray-800/50 backdrop-blur-sm border-t border-gray-700">
          <div className="flex flex-col items-center gap-4">
            <div className="flex justify-center items-center gap-6">
              {/* Dictation Only Button */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={isDictationActive ? stopConversation : handleStartDictation}
                  disabled={status === AppStatus.CONNECTING || isConversationActive}
                  className={`relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50
                    ${isDictationActive ? 'bg-red-600 hover:bg-red-700 focus:ring-red-400' : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-400'}
                    ${status === AppStatus.CONNECTING || isConversationActive ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  title={isDictationActive ? "עצור הכתבה" : "התחל הכתבה (ללא תשובה מ-AI)"}
                >
                  {isDictationActive ? (
                    <StopIcon className="w-6 h-6 text-white" />
                  ) : (
                    <DictationIcon className="w-6 h-6 text-white" />
                  )}
                  {status === AppStatus.TRANSCRIBING && (
                    <span className="absolute h-full w-full rounded-full bg-purple-500/50 animate-ping"></span>
                  )}
                </button>
                <span className="text-xs text-gray-400 font-medium">
                  {isDictationActive ? 'עצור הכתבה' : 'הכתבה בלבד'}
                </span>
              </div>
              
              {/* Conversation Button */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={isConversationActive ? stopConversation : handleStart}
                  disabled={status === AppStatus.CONNECTING || isDictationActive}
                  className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50
                    ${isConversationActive ? 'bg-red-600 hover:bg-red-700 focus:ring-red-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-400'}
                    ${status === AppStatus.CONNECTING || isDictationActive ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  title={isConversationActive ? "עצור שיחה" : "התחל שיחה עם AI"}
                >
                  {isConversationActive ? (
                    <StopIcon className="w-8 h-8 text-white" />
                  ) : (
                    <MicrophoneIcon className="w-8 h-8 text-white" />
                  )}
                  {status === AppStatus.LISTENING && (
                    <span className="absolute h-full w-full rounded-full bg-blue-500/50 animate-ping"></span>
                  )}
                </button>
                <span className="text-xs text-gray-400 font-medium">
                  {isConversationActive ? 'עצור שיחה' : 'שיחה עם AI'}
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
