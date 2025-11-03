
import React, { useState } from 'react';
import { useVoiceChat } from './hooks/useVoiceChat';
import { AppStatus } from './types';
import { MicrophoneIcon, StopIcon, DownloadIcon, UploadIcon, TrashIcon, SpeakerIcon, DictationIcon, FileTextIcon } from './components/Icons';
import { StatusIndicator } from './components/StatusIndicator';
import { Transcript } from './components/Transcript';

const App: React.FC = () => {
  const { 
    status, 
    transcript, 
    error, 
    startConversation,
    startDictationOnly,
    stopConversation,
    saveHistoryToFile,
    saveHistoryToTxt,
    clearHistory,
    loadHistoryFromFile,
    readHistoryAloud,
    stopReading,
    isReading,
    readTextFile,
    loadTextFile
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
    if (isReading) {
      stopReading();
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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl h-[90vh] flex flex-col bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <header className="flex-shrink-0 p-4 border-b border-gray-700 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-200">Gemini Voice Assistant</h1>
          <div className="flex items-center gap-2">
            <StatusIndicator status={status} />
            <div className="flex gap-2 ml-4">
              <button
                onClick={handleSaveHistory}
                disabled={transcript.length === 0}
                className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save history to JSON file"
              >
                <DownloadIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleSaveHistoryToTxt}
                disabled={transcript.length === 0}
                className="p-2 text-gray-400 hover:text-blue-300 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export conversation to TXT file"
              >
                <FileTextIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleLoadHistory}
                className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
                title="Load history from file (JSON)"
              >
                <UploadIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleLoadTextFile}
                className={`p-2 rounded-lg transition-colors ${
                  isReading 
                    ? 'text-purple-400 hover:text-purple-300 hover:bg-gray-700 bg-purple-900/30' 
                    : 'text-gray-400 hover:text-purple-300 hover:bg-gray-700'
                }`}
                title={isReading ? "Stop reading" : "Load and read text file (TXT)"}
              >
                <SpeakerIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleReadAloud}
                disabled={transcript.length === 0}
                className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isReading 
                    ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-700 bg-blue-900/30' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                }`}
                title={isReading ? "Stop reading" : "Read history aloud"}
              >
                <SpeakerIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleClearHistory}
                disabled={transcript.length === 0}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Clear history"
              >
                <TrashIcon className="w-5 h-5" />
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
        
        <footer className="flex-shrink-0 p-6 bg-gray-800/50 backdrop-blur-sm border-t border-gray-700">
          <div className="flex justify-center items-center gap-4">
            {/* Dictation Only Button */}
            <button
              onClick={isDictationActive ? stopConversation : handleStartDictation}
              disabled={status === AppStatus.CONNECTING || isConversationActive}
              className={`relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50
                ${isDictationActive ? 'bg-red-600 hover:bg-red-700 focus:ring-red-400' : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-400'}
                ${status === AppStatus.CONNECTING || isConversationActive ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title={isDictationActive ? "Stop dictation" : "Start dictation (no AI response)"}
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
            
            {/* Conversation Button */}
            <button
              onClick={isConversationActive ? stopConversation : handleStart}
              disabled={status === AppStatus.CONNECTING || isDictationActive}
              className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50
                ${isConversationActive ? 'bg-red-600 hover:bg-red-700 focus:ring-red-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-400'}
                ${status === AppStatus.CONNECTING || isDictationActive ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title={isConversationActive ? "Stop conversation" : "Start conversation with AI"}
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
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
