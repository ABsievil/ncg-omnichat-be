import { ENUM_ZALO_CHAT_ROLE } from 'src/modules/omnichat-bot/enums/omnichat-bot.enum';

export interface IZaloChatHistoryItem {
  role: ENUM_ZALO_CHAT_ROLE;
  content: string;
  senderName?: string;
}

export interface IZaloChatHistoryQuery {
  userId: string;
  threadId: string;
  isGroup: boolean;
}

export interface IZaloChatHistorySaveUserInput {
  userId: string;
  threadId: string;
  isGroup: boolean;
  content: string;
  senderName?: string;
}

export interface IZaloChatHistorySavePairInput {
  userId: string;
  threadId: string;
  isGroup: boolean;
  userContent: string;
  assistantContent: string;
  senderName?: string;
}
