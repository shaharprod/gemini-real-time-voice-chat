
import React from 'react';
import { ConversationTurn } from '../types';

interface TranscriptProps {
  transcript: ConversationTurn[];
}

export const Transcript: React.FC<TranscriptProps> = ({ transcript }) => {
  if (transcript.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p>Press the microphone to start the conversation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {transcript.map((turn, index) => (
        <div key={turn.id}>
          {turn.user && (
            <div className="flex justify-end">
              <p className={`p-3 rounded-xl max-w-lg bg-blue-600 text-white ${turn.isFinal ? '' : 'opacity-70'}`}>
                {turn.user}
              </p>
            </div>
          )}
          {turn.assistant && (
            <div className="flex justify-start mt-2">
              <p className={`p-3 rounded-xl max-w-lg bg-gray-600 text-gray-200 ${turn.isFinal ? '' : 'opacity-70'}`}>
                {turn.assistant}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
