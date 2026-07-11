import {
  DatabaseEntity,
  DatabaseProp,
  DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { DatabaseEntityBase } from 'src/common/database/entities/database.entity';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import {
  ENUM_MESSAGE_STATUS,
  ENUM_MESSAGE_TYPE,
} from 'src/modules/chat/enums/chat.enum';

@DatabaseEntity({ collection: 'chat_messages' })
export class ChatMessageEntity extends DatabaseEntityBase {
  @DatabaseProp({ required: true, index: true })
  conversationId: string;

  @DatabaseProp({ required: true, index: true })
  senderId: string;

  @DatabaseProp({
    required: true,
    enum: ENUM_MESSAGE_TYPE,
    default: ENUM_MESSAGE_TYPE.TEXT,
  })
  type: ENUM_MESSAGE_TYPE;

  @DatabaseProp({ required: false, default: '' })
  content?: string;

  @DatabaseProp({ required: false, default: null })
  mediaUrl?: string | null;

  @DatabaseProp({ required: false, type: Object, default: null })
  mediaMeta?: Record<string, any> | null;

  @DatabaseProp({ required: false, default: null })
  replyToMessageId?: string | null;

  @DatabaseProp({
    required: false,
    type: [
      {
        userId: String,
        emoji: String,
        createdAt: Date,
      },
    ],
    default: [],
  })
  reactions?: { userId: string; emoji: string; createdAt: Date }[];

  @DatabaseProp({
    required: true,
    enum: ENUM_MESSAGE_STATUS,
    default: ENUM_MESSAGE_STATUS.SENT,
  })
  status: ENUM_MESSAGE_STATUS;

  @DatabaseProp({ required: false, default: false })
  isRecalled?: boolean;

  @DatabaseProp({ required: false, type: [String], default: [] })
  deletedFor?: string[];

  @DatabaseProp({ required: false, default: null })
  clientMsgId?: string | null;

  @DatabaseProp({ required: false, type: Object, default: null })
  location?: { lat: number; lng: number; label?: string } | null;
}

export const ChatMessageSchema = DatabaseSchema(ChatMessageEntity);
export type ChatMessageDoc = IDatabaseDocument<ChatMessageEntity>;

ChatMessageSchema.index({ conversationId: 1, createdAt: -1 });
ChatMessageSchema.index({ conversationId: 1, _id: -1 });
ChatMessageSchema.index(
  { conversationId: 1, clientMsgId: 1 },
  { unique: true, sparse: true },
);
