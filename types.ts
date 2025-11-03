
export enum AppStatus {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  LISTENING = 'listening',
  SPEAKING = 'speaking',
  TRANSCRIBING = 'transcribing',
  ERROR = 'error',
}

export interface ConversationTurn {
  id: string;
  user: string;
  assistant: string;
  isFinal: boolean;
}
