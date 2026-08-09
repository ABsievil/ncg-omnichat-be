import {
  DatabaseEntity,
  DatabaseProp,
  DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { DatabaseEntityBase } from 'src/common/database/entities/database.entity';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { ENUM_CONVERSATION_TYPE } from 'src/modules/conversation/enums/conversation.enum';

@DatabaseEntity({ collection: 'conversations' })
export class ConversationEntity extends DatabaseEntityBase {
  @DatabaseProp({
    required: true,
    type: String,
    enum: Object.values(ENUM_CONVERSATION_TYPE),
    index: true,
  })
  type: ENUM_CONVERSATION_TYPE;

  @DatabaseProp({
    required: true,
    type: [String],
    index: true,
  })
  memberIds: string[];

  @DatabaseProp({ required: false, type: String, default: null })
  name?: string | null;

  @DatabaseProp({ required: false, type: String, default: null })
  avatarUrl?: string | null;

  @DatabaseProp({
    required: false,
    type: Object,
    default: null,
  })
  lastMessage?: {
    messageId: string;
    type: string;
    content: string;
    senderId: string;
    createdAt: Date;
  } | null;

  @DatabaseProp({ required: false, type: Date, index: true })
  lastMessageAt?: Date;

  @DatabaseProp({
    required: false,
    type: [String],
    default: [],
  })
  pinnedMessageIds?: string[];

  @DatabaseProp({
    required: false,
    type: Object,
    default: {},
  })
  settings?: {
    onlyAdminCanSend?: boolean;
    onlyAdminCanAddMembers?: boolean;
  };

  /** For direct chats: sorted "userA:userB" for uniqueness */
  @DatabaseProp({
    required: false,
    type: String,
    unique: true,
    sparse: true,
    index: true,
  })
  directKey?: string | null;
}

export const ConversationSchema = DatabaseSchema(ConversationEntity);
export type ConversationDoc = IDatabaseDocument<ConversationEntity>;

ConversationSchema.index({ memberIds: 1, lastMessageAt: -1 });
