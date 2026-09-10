import {
  DatabaseEntity,
  DatabaseProp,
  DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { DatabaseEntityBase } from 'src/common/database/entities/database.entity';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { ENUM_ZALO_CHAT_ROLE } from 'src/modules/omnichat-bot/enums/omnichat-bot.enum';

@DatabaseEntity({ collection: 'zalo_chat_history' })
export class ZaloChatHistoryEntity extends DatabaseEntityBase {
  @DatabaseProp({ required: true, index: true })
  userId!: string;

  @DatabaseProp({ required: true, index: true })
  threadId!: string;

  @DatabaseProp({
    required: true,
    type: String,
    enum: Object.values(ENUM_ZALO_CHAT_ROLE),
  })
  role!: ENUM_ZALO_CHAT_ROLE;

  @DatabaseProp({ required: true, default: '' })
  content!: string;

  @DatabaseProp({ required: false, type: String, default: null })
  senderName?: string | null;

  @DatabaseProp({ required: true, type: Date, index: true, default: Date.now })
  timestamp!: Date;
}

export const ZaloChatHistorySchema = DatabaseSchema(ZaloChatHistoryEntity);
export type ZaloChatHistoryDoc = IDatabaseDocument<ZaloChatHistoryEntity>;

ZaloChatHistorySchema.index({ userId: 1, timestamp: -1 });
ZaloChatHistorySchema.index({ threadId: 1, timestamp: -1 });
