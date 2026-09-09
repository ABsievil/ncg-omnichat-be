export const ZALO_STOP_KEYWORDS = ['stop', 'dung', 'spam'] as const;

export const ZALO_LOGIN_MAX_RETRIES = 3;
export const ZALO_LOGIN_RETRY_DELAY_MS = 3000;

export const ZALO_BLOCKED_MESSAGE =
  'Xin lỗi, tin nhắn của bạn đã bị chặn.';

/** Redis pub/sub: API → worker sau khi QR/session renew. */
export const ZALO_REDIS_CHANNEL_SESSION_RENEWED = 'zalo:session:renewed';

/** Redis pub/sub: API → worker khi ngắt kết nối / tắt auto-reply. */
export const ZALO_REDIS_CHANNEL_SESSION_DISABLED = 'zalo:session:disabled';

/** Default Zalo msgType when quoting a plain-text inbound message. */
export const ZALO_QUOTE_DEFAULT_MSG_TYPE = 'webchat';
