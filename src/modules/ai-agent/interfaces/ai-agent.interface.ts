export interface IAiAgentHistoryItem {
  role: 'user' | 'assistant';
  content: string;
  senderName?: string;
}

export interface IAiAgentInput {
  userId: string;
  message: string;
  history: IAiAgentHistoryItem[];
  senderName?: string;
  isGroup?: boolean;
  shopId?: string;
  systemPrompt?: string;
  kbFilterShopId?: string;
  shopName?: string;
}
