import { BOT_PROFILE_DEFAULT_FALLBACK } from 'src/modules/bot-profile/constants/bot-profile.constant';

export const OMNICHAT_BOT_HISTORY_LIMIT = 10;

export const OMNICHAT_BOT_FALLBACK_MESSAGE = BOT_PROFILE_DEFAULT_FALLBACK;

export const OMNICHAT_BOT_MAX_REPLIES_PER_MINUTE = 8;
export const OMNICHAT_BOT_THREAD_REPLY_INTERVAL_SECONDS = 5;
export const OMNICHAT_BOT_DELAY_MIN_MS = 2000;
export const OMNICHAT_BOT_DELAY_MAX_MS = 6000;
export const OMNICHAT_BOT_GREETING_TTL_SECONDS = 60 * 60 * 24 * 30;
export const OMNICHAT_BOT_OUTBOUND_ECHO_TTL_SECONDS = 20;

export const OMNICHAT_BOT_STRANGER_GREETING =
  'Chào bạn, hiện shop chỉ trả lời khách đã từng nhắn tin. Bạn vui lòng kết bạn hoặc nhắn từ cuộc chat cũ nhé.';

export const OMNICHAT_BOT_AI_LABEL = 'Trả lời bởi OmniChat AI';

export const OMNICHAT_BOT_REDIS_KEYS = {
  pause: (shopId: string, threadId: string) =>
    `bot:pause:${shopId}:${threadId}`,
  threadRate: (shopId: string, threadId: string) =>
    `bot:rl:thread:${shopId}:${threadId}`,
  shopRate: (shopId: string, minuteKey: string) =>
    `bot:rl:shop:${shopId}:${minuteKey}`,
  greeted: (shopId: string, userId: string) =>
    `bot:greeted:${shopId}:${userId}`,
  mute: (shopId: string, threadId: string) => `bot:mute:${shopId}:${threadId}`,
  outbound: (shopId: string, threadId: string) =>
    `bot:outbound:${shopId}:${threadId}`,
  aiLabel: (shopId: string, threadId: string, dayKey: string) =>
    `bot:label:${shopId}:${threadId}:${dayKey}`,
} as const;
