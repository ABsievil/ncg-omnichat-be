export const OMNICHAT_BOT_HISTORY_LIMIT = 10;

/** Hot cache for the last N turns so the next mention can reuse context. */
export const OMNICHAT_BOT_HISTORY_TTL_SECONDS = 60 * 60 * 24 * 7;

export const OMNICHAT_BOT_REDIS_KEYS = {
  chatHistoryByThread: (threadId: string) =>
    `zalo:chat-history:thread:${threadId}`,
  chatHistoryByUser: (userId: string) => `zalo:chat-history:user:${userId}`,
} as const;
