
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
  } = useVoiceChat();
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const textFileInputRef = React.useRef<HTMLInputElement>(null);
  const textInputRef = React.useRef<HTMLTextAreaElement>(null);

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


  const handleSendTextMessage = async () => {
    if (!textInput.trim()) {
      return;
    }

    if (!isConversationActive) {
      alert('יש להתחיל שיחה לפני שליחת הודעות טקסט');
      return;
    }

    const messageText = textInput.trim();
    setTextInput(''); // Clear input after sending

    const success = await sendTextMessage(messageText);
    if (!success) {
      alert('שגיאה בשליחת ההודעה. ודא שהשיחה פעילה.');
      setTextInput(messageText); // Restore text if failed
    }
  };

  const handleTextInputKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendTextMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl h-[90vh] flex flex-col bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <header className="flex-shrink-0 p-2 border-b border-gray-700 flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-gray-200">Gemini Voice Assistant</h1>
            <p className="text-xs text-gray-400">עוזר קולי עם חיפוש בזמן אמת</p>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <StatusIndicator status={status} />
            <button
              onClick={() => setIsSearchEnabled(!isSearchEnabled)}
              className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                isSearchEnabled
                  ? 'bg-blue-900/30 border-blue-700/50 hover:bg-blue-900/50'
                  : 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50'
              }`}
              title={isSearchEnabled ? "כיבוי חיפוש בזמן אמת" : "הפעלת חיפוש בזמן אמת"}
            >
              <SearchIcon className={`w-3 h-3 ${isSearchEnabled ? 'text-blue-400' : 'text-gray-500'}`} />
              <span className={`text-xs font-medium ${isSearchEnabled ? 'text-blue-300' : 'text-gray-400'} hidden sm:inline`}>
                {isSearchEnabled ? 'חיפוש' : 'חיפוש'}
              </span>
            </button>
            <button
              onClick={() => setIsCustomSearchEnabled(!isCustomSearchEnabled)}
              className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors relative ${
                isCustomSearchEnabled
                  ? apiConnectionStatus === 'connected' && searchStatus === 'connected'
                    ? 'bg-green-900/40 border-green-600/60 hover:bg-green-900/50 shadow-lg shadow-green-500/20'
                    : apiConnectionStatus === 'connected'
                    ? 'bg-purple-900/30 border-purple-700/50 hover:bg-purple-900/50'
                    : apiConnectionStatus === 'error' || searchStatus === 'error'
                    ? 'bg-red-900/40 border-red-600/60 hover:bg-red-900/50'
                    : apiConnectionStatus === 'disconnected' || searchStatus === 'no-api'
                    ? 'bg-yellow-900/40 border-yellow-600/60 hover:bg-yellow-900/50'
                    : 'bg-purple-900/30 border-purple-700/50 hover:bg-purple-900/50'
                  : 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50'
              }`}
              title={
                isCustomSearchEnabled
                  ? apiConnectionStatus === 'connected' && searchStatus === 'connected'
                    ? `Custom Search API מחובר ✅ | חיפוש אחרון: ${lastSearchTime ? lastSearchTime.toLocaleTimeString('he-IL') : 'לא בוצע'}`
                    : apiConnectionStatus === 'connected'
                    ? 'Custom Search API מחובר - ממתין לחיפוש'
                    : apiConnectionStatus === 'error' || searchStatus === 'error'
                    ? 'שגיאה בחיבור ל-Custom Search API - בדוק את הקונסול'
                    : apiConnectionStatus === 'disconnected' || searchStatus === 'no-api'
                    ? 'Custom Search API לא מוגדר - הגדר API Key ו-CX'
                    : 'בודק חיבור ל-Custom Search API...'
                  : "הפעלת Custom Search API"
              }
            >
              <SearchIcon className={`w-3 h-3 ${
                isCustomSearchEnabled
                  ? apiConnectionStatus === 'connected' && searchStatus === 'connected'
                    ? 'text-green-400'
                    : apiConnectionStatus === 'connected'
                    ? 'text-purple-400'
                    : apiConnectionStatus === 'error' || searchStatus === 'error'
                    ? 'text-red-400'
                    : apiConnectionStatus === 'disconnected' || searchStatus === 'no-api'
                    ? 'text-yellow-400'
                    : 'text-purple-400'
                  : 'text-gray-500'
              }`} />
              <span className={`text-xs font-medium ${
                isCustomSearchEnabled
                  ? apiConnectionStatus === 'connected' && searchStatus === 'connected'
                    ? 'text-green-300'
                    : apiConnectionStatus === 'connected'
                    ? 'text-purple-300'
                    : apiConnectionStatus === 'error' || searchStatus === 'error'
                    ? 'text-red-300'
                    : apiConnectionStatus === 'disconnected' || searchStatus === 'no-api'
                    ? 'text-yellow-300'
                    : 'text-purple-300'
                  : 'text-gray-400'
              } hidden sm:inline`}>
                Custom
              </span>
              {isCustomSearchEnabled && (
                <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                  apiConnectionStatus === 'connected' && searchStatus === 'connected'
                    ? 'bg-green-400 animate-pulse'
                    : apiConnectionStatus === 'connected'
                    ? 'bg-purple-400'
                    : apiConnectionStatus === 'error' || searchStatus === 'error'
                    ? 'bg-red-400'
                    : apiConnectionStatus === 'disconnected' || searchStatus === 'no-api'
                    ? 'bg-yellow-400'
                    : 'bg-gray-400 animate-pulse'
                }`}></span>
              )}
            </button>
            <button
              onClick={() => setIsAssistantMuted(!isAssistantMuted)}
              className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                !isAssistantMuted
                  ? 'bg-green-900/30 border-green-700/50 hover:bg-green-900/50'
                  : 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50'
              }`}
              title={isAssistantMuted ? "הפעלת קול האסיסטנט" : "השתקת האסיסטנט"}
            >
              {!isAssistantMuted ? (
                <Volume2Icon className="w-3 h-3 text-green-400" />
              ) : (
                <VolumeXIcon className="w-3 h-3 text-gray-500" />
              )}
              <span className={`text-xs font-medium ${!isAssistantMuted ? 'text-green-300' : 'text-gray-400'} hidden sm:inline`}>
                {!isAssistantMuted ? 'קול' : 'מושתק'}
              </span>
            </button>
            <div className="flex gap-1 ml-2 flex-wrap">
              <button
                onClick={handleSaveHistory}
                disabled={transcript.length === 0}
                className="flex items-center gap-1 px-2 py-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="שמור היסטוריה לקובץ JSON"
              >
                <DownloadIcon className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">שמור JSON</span>
              </button>
              <button
                onClick={handleSaveHistoryToTxt}
                disabled={transcript.length === 0}
                className="flex items-center gap-1 px-2 py-1 text-gray-400 hover:text-blue-300 hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="ייצא שיחה לקובץ TXT"
              >
                <FileTextIcon className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">ייצא TXT</span>
              </button>
              <button
                onClick={handleLoadHistory}
                className="flex items-center gap-1 px-2 py-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
                title="טען היסטוריה מקובץ JSON"
              >
                <UploadIcon className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">טען JSON</span>
              </button>
              <button
                onClick={handleLoadTextFile}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                  isReading 
                    ? 'text-purple-400 hover:text-purple-300 hover:bg-gray-700 bg-purple-900/30' 
                    : 'text-gray-400 hover:text-purple-300 hover:bg-gray-700'
                }`}
                title={isReading ? "עצור הקראה" : "טען והקרא קובץ טקסט"}
              >
                <SpeakerIcon className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">{isReading ? 'עצור' : 'הקרא קובץ'}</span>
              </button>
              {/* Reading Control Buttons */}
              {isReading && (
                <>
                  {isPaused ? (
                    <button
                      onClick={resumeReading}
                      className="flex items-center gap-1 px-2 py-1 text-green-400 hover:text-green-300 hover:bg-gray-700 rounded transition-colors"
                      title="המשך הקראה"
                    >
                      <PlayIcon className="w-4 h-4" />
                      <span className="text-xs hidden sm:inline">המשך</span>
                    </button>
                  ) : (
                    <button
                      onClick={pauseReading}
                      className="flex items-center gap-1 px-2 py-1 text-yellow-400 hover:text-yellow-300 hover:bg-gray-700 rounded transition-colors"
                      title="השהה הקראה"
                    >
                      <PauseIcon className="w-4 h-4" />
                      <span className="text-xs hidden sm:inline">השהה</span>
                    </button>
                  )}
                  <button
                    onClick={stopReading}
                    className="flex items-center gap-1 px-2 py-1 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded transition-colors"
                    title="עצור הקראה"
                  >
                    <StopIcon className="w-4 h-4" />
                    <span className="text-xs hidden sm:inline">עצור</span>
                  </button>
                </>
              )}
              {!isReading && (
                <button
                  onClick={handleReadAloud}
                  disabled={transcript.length === 0}
                  className={`flex items-center gap-1 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  }`}
                  title="הקרא היסטוריה בקול"
                >
                  <SpeakerIcon className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">הקרא היסטוריה</span>
                </button>
              )}
              <button
                onClick={handleClearHistory}
                disabled={transcript.length === 0}
                className="flex items-center gap-1 px-2 py-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="נקה היסטוריה"
              >
                <TrashIcon className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">נקה</span>
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

        <main className="flex-1 overflow-y-auto p-4">
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
        
        <footer className="flex-shrink-0 p-3 bg-gray-800/50 backdrop-blur-sm border-t border-gray-700">
          <div className="flex flex-col items-center gap-2">
            {/* Text Input Field */}
            {isConversationActive && (
              <div className="w-full max-w-2xl mb-1">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={textInputRef}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyPress={handleTextInputKeyPress}
                    placeholder="כתוב הוראות, לינקים, או שאלות כאן... (Enter לשליחה, Shift+Enter לשורה חדשה)"
                    className="flex-1 min-h-[50px] max-h-[100px] p-2 text-sm bg-gray-700/50 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    disabled={!isConversationActive}
                  />
                  <button
                    onClick={handleSendTextMessage}
                    disabled={!textInput.trim() || !isConversationActive}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm"
                    title="שלח הודעה (Enter)"
                  >
                    שלח
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">
                  ניתן לכתוב הוראות, לינקים, או שאלות - המודל יקבל אותן מיד
                </p>
              </div>
            )}
            
            <div className="flex justify-center items-center gap-3">
              {/* Dictation Only Button */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={isDictationActive ? stopConversation : handleStartDictation}
                  disabled={status === AppStatus.CONNECTING || isConversationActive}
                  className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-50
                    ${isDictationActive ? 'bg-red-600 hover:bg-red-700 focus:ring-red-400' : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-400'}
                    ${status === AppStatus.CONNECTING || isConversationActive ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  title={isDictationActive ? "עצור הכתבה" : "התחל הכתבה (ללא תשובה מ-AI)"}
                >
                  {isDictationActive ? (
                    <StopIcon className="w-5 h-5 text-white" />
                  ) : (
                    <DictationIcon className="w-5 h-5 text-white" />
                  )}
                  {status === AppStatus.TRANSCRIBING && (
                    <span className="absolute h-full w-full rounded-full bg-purple-500/50 animate-ping"></span>
                  )}
                </button>
                <span className="text-xs text-gray-400 font-medium">
                  {isDictationActive ? 'עצור' : 'הכתבה'}
                </span>
              </div>
              
              {/* Conversation Button */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={isConversationActive ? stopConversation : handleStart}
                  disabled={status === AppStatus.CONNECTING || isDictationActive}
                  className={`relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-50
                    ${isConversationActive ? 'bg-red-600 hover:bg-red-700 focus:ring-red-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-400'}
                    ${status === AppStatus.CONNECTING || isDictationActive ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  title={isConversationActive ? "עצור שיחה" : "התחל שיחה עם AI"}
                >
                  {isConversationActive ? (
                    <StopIcon className="w-7 h-7 text-white" />
                  ) : (
                    <MicrophoneIcon className="w-7 h-7 text-white" />
                  )}
                  {status === AppStatus.LISTENING && (
                    <span className="absolute h-full w-full rounded-full bg-blue-500/50 animate-ping"></span>
                  )}
                </button>
                <span className="text-xs text-gray-400 font-medium">
                  {isConversationActive ? 'עצור' : 'שיחה'}
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
