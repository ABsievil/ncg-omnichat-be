import { ENUM_BOT_PROFILE_TONE } from 'src/modules/bot-profile/enums/bot-profile.enum';
import {
  IBotProfileSnapshot,
  IBotWorkingHours,
} from 'src/modules/bot-profile/interfaces/bot-profile.interface';

export const BOT_PROFILE_CACHE_TTL_SECONDS = 30;
export const BOT_PROFILE_DEFAULT_PAUSE_MINUTES = 45;
export const BOT_PROFILE_DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

export const BOT_PROFILE_DEFAULT_WORKING_HOURS: IBotWorkingHours = {
  enabled: false,
  timezone: BOT_PROFILE_DEFAULT_TIMEZONE,
  start: '00:00',
  end: '24:00',
};

export const BOT_PROFILE_DEFAULT_FALLBACK =
  'Xin lỗi, hiện shop chưa có thông tin này. Bên mình sẽ phản hồi sớm nhất có thể.';

export const BOT_PROFILE_REDIS_KEYS = {
  cache: (shopId: string) => `bot-profile:${shopId}`,
} as const;

export function botProfileCacheKey(shopId: string): string {
  return BOT_PROFILE_REDIS_KEYS.cache(shopId);
}

export function buildDefaultBotProfile(
  shopId: string,
  botName: string,
): IBotProfileSnapshot {
  return {
    shopId,
    botName: botName.trim() || 'Trợ lý shop',
    tone: ENUM_BOT_PROFILE_TONE.FRIENDLY,
    systemPromptExtra: '',
    fallbackMessage: BOT_PROFILE_DEFAULT_FALLBACK,
    workingHours: { ...BOT_PROFILE_DEFAULT_WORKING_HOURS },
    replyToStrangers: true,
    pauseMinutes: BOT_PROFILE_DEFAULT_PAUSE_MINUTES,
    enabled: true,
    mutedThreadIds: [],
    showAiLabel: false,
    zaloRiskAcceptedAt: null,
  };
}
