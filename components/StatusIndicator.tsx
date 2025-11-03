
import React from 'react';
import { AppStatus } from '../types';

interface StatusIndicatorProps {
  status: AppStatus;
}

const statusConfig = {
  [AppStatus.IDLE]: { text: 'Idle', color: 'bg-gray-500' },
  [AppStatus.CONNECTING]: { text: 'Connecting...', color: 'bg-yellow-500 animate-pulse' },
  [AppStatus.LISTENING]: { text: 'Listening...', color: 'bg-blue-500 animate-pulse' },
  [AppStatus.SPEAKING]: { text: 'Speaking...', color: 'bg-green-500' },
  [AppStatus.TRANSCRIBING]: { text: 'Transcribing...', color: 'bg-purple-500 animate-pulse' },
  [AppStatus.ERROR]: { text: 'Error', color: 'bg-red-500' },
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const { text, color } = statusConfig[status];

  return (
    <div className="flex items-center space-x-2">
      <span className={`w-3 h-3 rounded-full ${color}`}></span>
      <span className="text-sm font-medium text-gray-300">{text}</span>
    </div>
  );
};
