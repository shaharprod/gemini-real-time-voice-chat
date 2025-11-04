
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
  sources?: string[]; // URLs from search results
}

export interface ArticleInfo {
  url: string;
  title: string;
  content?: string;
}

export interface SourceInfo {
  url: string;
  title?: string; // Optional title - will be fetched if not provided
}
