import { ENUM_BOT_PROFILE_TONE } from 'src/modules/bot-profile/enums/bot-profile.enum';

export interface IBotWorkingHours {
  enabled: boolean;
  timezone: string;
  start: string;
  end: string;
}

export interface IBotProfileSnapshot {
  shopId: string;
  botName: string;
  tone: ENUM_BOT_PROFILE_TONE;
  systemPromptExtra: string;
  fallbackMessage: string;
  workingHours: IBotWorkingHours;
  replyToStrangers: boolean;
  pauseMinutes: number;
  enabled: boolean;
  mutedThreadIds: string[];
  showAiLabel: boolean;
  zaloRiskAcceptedAt: string | null;
}
