import {
  DatabaseEntity,
  DatabaseProp,
  DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { DatabaseEntityBase } from 'src/common/database/entities/database.entity';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { BOT_PROFILE_DEFAULT_FALLBACK } from 'src/modules/bot-profile/constants/bot-profile.constant';
import { ENUM_BOT_PROFILE_TONE } from 'src/modules/bot-profile/enums/bot-profile.enum';
import type { IBotWorkingHours } from 'src/modules/bot-profile/interfaces/bot-profile.interface';

@DatabaseEntity({ collection: 'bot_profiles' })
export class BotProfileEntity extends DatabaseEntityBase {
  @DatabaseProp({
    required: true,
    unique: true,
    index: true,
    trim: true,
  })
  shopId!: string;

  @DatabaseProp({
    required: true,
    trim: true,
    maxlength: 80,
  })
  botName!: string;

  @DatabaseProp({
    required: true,
    type: String,
    enum: Object.values(ENUM_BOT_PROFILE_TONE),
    default: ENUM_BOT_PROFILE_TONE.FRIENDLY,
  })
  tone!: ENUM_BOT_PROFILE_TONE;

  @DatabaseProp({ required: false, default: '', maxlength: 2000 })
  systemPromptExtra?: string;

  @DatabaseProp({
    required: true,
    default: BOT_PROFILE_DEFAULT_FALLBACK,
    maxlength: 500,
  })
  fallbackMessage!: string;

  @DatabaseProp({
    required: true,
    type: Object,
    default: () => ({
      enabled: false,
      timezone: 'Asia/Ho_Chi_Minh',
      start: '00:00',
      end: '24:00',
    }),
  })
  workingHours!: IBotWorkingHours;

  @DatabaseProp({ required: true, default: true })
  replyToStrangers!: boolean;

  @DatabaseProp({ required: true, default: 45, min: 5, max: 180 })
  pauseMinutes!: number;

  @DatabaseProp({ required: true, default: true })
  enabled!: boolean;

  @DatabaseProp({ required: true, type: [String], default: [] })
  mutedThreadIds!: string[];

  @DatabaseProp({ required: true, default: false })
  showAiLabel!: boolean;

  @DatabaseProp({ required: false, type: Date, default: null })
  zaloRiskAcceptedAt?: Date | null;
}

export const BotProfileSchema = DatabaseSchema(BotProfileEntity);
export type BotProfileDoc = IDatabaseDocument<BotProfileEntity>;
