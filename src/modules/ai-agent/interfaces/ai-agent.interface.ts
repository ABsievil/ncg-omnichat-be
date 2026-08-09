export interface IAiAgentHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface IAiAgentInput {
  userId: string;
  message: string;
  history: IAiAgentHistoryItem[];
}
