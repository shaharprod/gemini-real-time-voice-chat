
import React from 'react';
import { ConversationTurn } from '../types';

interface TranscriptProps {
  transcript: ConversationTurn[];
}

// פונקציה שמפרשת טקסט ומציגה לינקים כקישורים
const parseTextWithLinks = (text: string): React.ReactNode[] => {
  // תבנית למציאת URLs
  const urlPattern = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = urlPattern.exec(text)) !== null) {
    // הוסף טקסט לפני הלינק
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // הוסף את הלינק כקישור
    const url = match[0];
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 underline break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>
    );
    
    lastIndex = match.index + url.length;
  }
  
  // הוסף את שאר הטקסט
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : [text];
};

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
              <div className={`p-3 rounded-xl max-w-lg bg-blue-600 text-white ${turn.isFinal ? '' : 'opacity-70'} break-words`}>
                {parseTextWithLinks(turn.user)}
              </div>
            </div>
          )}
          {turn.assistant && (
            <div className="flex justify-start mt-2">
              <div className={`p-3 rounded-xl max-w-lg bg-gray-600 text-gray-200 ${turn.isFinal ? '' : 'opacity-70'} break-words`}>
                {parseTextWithLinks(turn.assistant)}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
