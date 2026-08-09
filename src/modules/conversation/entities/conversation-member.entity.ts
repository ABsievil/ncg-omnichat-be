import {
  DatabaseEntity,
  DatabaseProp,
  DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { DatabaseEntityBase } from 'src/common/database/entities/database.entity';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { ENUM_MEMBER_ROLE } from 'src/modules/conversation/enums/conversation.enum';

@DatabaseEntity({ collection: 'conversation_members' })
export class ConversationMemberEntity extends DatabaseEntityBase {
  @DatabaseProp({ required: true, index: true })
  conversationId: string;

  @DatabaseProp({ required: true, index: true })
  userId: string;

  @DatabaseProp({
    required: true,
    type: String,
    enum: Object.values(ENUM_MEMBER_ROLE),
    default: ENUM_MEMBER_ROLE.MEMBER,
  })
  role: ENUM_MEMBER_ROLE;

  @DatabaseProp({ required: false, type: Date })
  joinedAt?: Date;

  @DatabaseProp({ required: false, type: Date, default: null })
  mutedUntil?: Date | null;

  @DatabaseProp({ required: false, default: 0 })
  unreadCount?: number;

  @DatabaseProp({ required: false, type: String, default: null })
  lastReadMessageId?: string | null;

  @DatabaseProp({ required: false, default: false })
  isPinned?: boolean;

  @DatabaseProp({ required: false, default: false })
  isMuted?: boolean;
}

export const ConversationMemberSchema = DatabaseSchema(
  ConversationMemberEntity,
);
export type ConversationMemberDoc = IDatabaseDocument<ConversationMemberEntity>;

ConversationMemberSchema.index(
  { conversationId: 1, userId: 1 },
  { unique: true },
);
ConversationMemberSchema.index({ userId: 1, isPinned: -1 });
