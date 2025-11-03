
import React, { useState } from 'react';
import { useVoiceChat } from './hooks/useVoiceChat';
import { AppStatus } from './types';
import { MicrophoneIcon, StopIcon, DownloadIcon, UploadIcon, TrashIcon } from './components/Icons';
import { StatusIndicator } from './components/StatusIndicator';
import { Transcript } from './components/Transcript';

const App: React.FC = () => {
  const { 
    status, 
    transcript, 
    error, 
    startConversation, 
    stopConversation,
    saveHistoryToFile,
    clearHistory,
    loadHistoryFromFile
  } = useVoiceChat();
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const isConversationActive = status !== AppStatus.IDLE && status !== AppStatus.ERROR;

  const handleSaveHistory = () => {
    try {
      saveHistoryToFile();
    } catch (err) {
      console.error('Failed to save history:', err);
      alert('Failed to save history. Please try again.');
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
                title="Save history to file"
              >
                <DownloadIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleLoadHistory}
                className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
                title="Load history from file"
              >
                <UploadIcon className="w-5 h-5" />
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
          <div className="flex justify-center items-center">
            <button
              onClick={isConversationActive ? stopConversation : handleStart}
              disabled={status === AppStatus.CONNECTING}
              className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50
                ${isConversationActive ? 'bg-red-600 hover:bg-red-700 focus:ring-red-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-400'}
                ${status === AppStatus.CONNECTING ? 'opacity-50 cursor-not-allowed' : ''}
              `}
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
