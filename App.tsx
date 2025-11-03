
import React, { useState } from 'react';
import { useVoiceChat } from './hooks/useVoiceChat';
import { AppStatus } from './types';
import { MicrophoneIcon, StopIcon } from './components/Icons';
import { StatusIndicator } from './components/StatusIndicator';
import { Transcript } from './components/Transcript';

const App: React.FC = () => {
  const { status, transcript, error, startConversation, stopConversation } = useVoiceChat();
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl h-[90vh] flex flex-col bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <header className="flex-shrink-0 p-4 border-b border-gray-700 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-200">Gemini Voice Assistant</h1>
          <StatusIndicator status={status} />
        </header>

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
