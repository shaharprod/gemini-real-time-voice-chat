
import React from 'react';
import { ConversationTurn } from '../types';

interface TranscriptProps {
  transcript: ConversationTurn[];
}

// פונקציה שמפרשת טקסט ומציגה לינקים כקישורים
const parseTextWithLinks = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // תבנית משופרת למציאת URLs - כולל כל סוגי הלינקים
  // תבנית 1: http:// או https:// (הכי נפוץ)
  // תבנית 2: www. (ללא http/https)
  // תבנית 3: דומיינים נפוצים (.com, .co.il, .org, .net, וכו') - רק אם נראה כמו URL
  const urlPatterns = [
    // https:// או http://
    /(https?:\/\/[^\s<>"{}|\\^`\[\]()]+)/gi,
    // www.
    /(www\.[^\s<>"{}|\\^`\[\]()]+)/gi,
    // דומיינים נפוצים (רק אם יש נקודה לפני)
    /([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.(com|co\.il|org|net|io|edu|gov|mil|int|biz|info|name|mobi|asia|jobs|tel|travel|academy|agency|app|art|blog|business|center|cloud|company|design|dev|digital|directory|email|events|expert|finance|foundation|global|group|guide|help|host|info|international|investments|law|legal|life|live|media|network|news|online|photo|pictures|pro|production|pub|reviews|solutions|space|store|studio|support|tech|technology|today|training|website|world|xyz|zone)(\/[^\s<>"{}|\\^`\[\]()]*)?)/gi
  ];
  
  // אוסף את כל הלינקים עם המיקום שלהם
  const allMatches: Array<{ index: number; url: string; fullMatch: string }> = [];
  
  for (const pattern of urlPatterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // בדוק אם הלינק לא כבר נמצא (כדי למנוע כפילויות)
      const isDuplicate = allMatches.some(m => 
        m.index === match.index || 
        (match.index >= m.index && match.index < m.index + m.fullMatch.length)
      );
      
      if (!isDuplicate) {
        allMatches.push({
          index: match.index,
          url: match[0],
          fullMatch: match[0]
        });
      }
    }
  }
  
  // מיין לפי מיקום
  allMatches.sort((a, b) => a.index - b.index);
  
  // בנה את החלקים
  for (const match of allMatches) {
    // הוסף טקסט לפני הלינק
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // הוסף את הלינק כקישור
    let url = match.url;
    
    // ניקוי סימני פיסוק בסוף הלינק
    const cleanedUrl = url.replace(/[.,!?;:]+$/, '');
    
    // אם הלינק לא מתחיל ב-http/https, הוסף https://
    let href = cleanedUrl;
    if (!cleanedUrl.match(/^https?:\/\//i)) {
      if (cleanedUrl.startsWith('www.')) {
        href = 'https://' + cleanedUrl;
      } else {
        href = 'https://' + cleanedUrl;
      }
    }
    
    parts.push(
      <a
        key={match.index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 underline break-all cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.open(href, '_blank', 'noopener,noreferrer');
        }}
      >
        {cleanedUrl}
      </a>
    );
    
    lastIndex = match.index + match.fullMatch.length;
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
