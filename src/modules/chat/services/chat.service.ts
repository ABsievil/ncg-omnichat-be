import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.connection.constant';
import { ChatMessageEntity } from 'src/modules/chat/entities/chat-message.entity';
import {
  ENUM_MESSAGE_STATUS,
  ENUM_MESSAGE_TYPE,
} from 'src/modules/chat/enums/chat.enum';
import { ConversationEntity } from 'src/modules/conversation/entities/conversation.entity';
import { ConversationMemberEntity } from 'src/modules/conversation/entities/conversation-member.entity';

export interface SendMessageInput {
  conversationId: string;
  senderId: string;
  type?: ENUM_MESSAGE_TYPE;
  content?: string;
  mediaUrl?: string;
  replyToMessageId?: string;
  clientMsgId?: string;
}

/** Default-scoped — safe for HTTP controllers and WebSocket gateway */
@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ConversationEntity.name, DATABASE_CONNECTION_NAME)
    private readonly conversationModel: Model<ConversationEntity>,
    @InjectModel(ConversationMemberEntity.name, DATABASE_CONNECTION_NAME)
    private readonly memberModel: Model<ConversationMemberEntity>,
    @InjectModel(ChatMessageEntity.name, DATABASE_CONNECTION_NAME)
    private readonly messageModel: Model<ChatMessageEntity>,
  ) {}

  async assertMember(conversationId: string, userId: string) {
    const member = await this.memberModel
      .findOne({ conversationId, userId, deleted: false })
      .exec();
    if (!member) {
      throw new ForbiddenException('conversation.error.notMember');
    }
    return member;
  }

  async sendMessage(input: SendMessageInput) {
    await this.assertMember(input.conversationId, input.senderId);

    if (input.clientMsgId) {
      const existing = await this.messageModel
        .findOne({
          conversationId: input.conversationId,
          clientMsgId: input.clientMsgId,
          deleted: false,
        })
        .exec();
      if (existing) {
        return existing;
      }
    }

    const conversation = await this.conversationModel
      .findOne({ _id: input.conversationId, deleted: false })
      .exec();
    if (!conversation) {
      throw new NotFoundException('conversation.error.notFound');
    }

    const message = await this.messageModel.create({
      conversationId: input.conversationId,
      senderId: input.senderId,
      type: input.type ?? ENUM_MESSAGE_TYPE.TEXT,
      content: input.content ?? '',
      mediaUrl: input.mediaUrl ?? null,
      replyToMessageId: input.replyToMessageId ?? null,
      clientMsgId: input.clientMsgId ?? null,
      status: ENUM_MESSAGE_STATUS.SENT,
      isRecalled: false,
      deletedFor: [],
      reactions: [],
      deleted: false,
    });

    const preview = {
      messageId: message._id,
      type: message.type,
      content: message.content ?? '',
      senderId: message.senderId,
      createdAt: (message as any).createdAt ?? new Date(),
    };

    await this.conversationModel.updateOne(
      { _id: input.conversationId },
      { $set: { lastMessage: preview, lastMessageAt: preview.createdAt } },
    );

    await this.memberModel.updateMany(
      {
        conversationId: input.conversationId,
        userId: { $ne: input.senderId },
        deleted: false,
      },
      { $inc: { unreadCount: 1 } },
    );

    return message;
  }

  async listMessages(
    conversationId: string,
    userId: string,
    options: { cursor?: string; limit?: number },
  ) {
    await this.assertMember(conversationId, userId);
    const limit = Math.min(options.limit ?? 30, 100);
    const filter: Record<string, any> = {
      conversationId,
      deleted: false,
      deletedFor: { $ne: userId },
    };

    if (options.cursor) {
      const [createdAt, id] = options.cursor.split('|');
      filter.$or = [
        { createdAt: { $lt: new Date(createdAt) } },
        { createdAt: new Date(createdAt), _id: { $lt: id } },
      ];
    }

    const rows = await this.messageModel
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean()
      .exec();

    const nextCursor =
      rows.length === limit
        ? `${(rows[rows.length - 1] as any).createdAt.toISOString()}|${(rows[rows.length - 1] as any)._id}`
        : null;

    return { items: rows.reverse(), nextCursor };
  }

  async markSeen(
    conversationId: string,
    userId: string,
    lastReadMessageId: string,
  ) {
    await this.assertMember(conversationId, userId);
    await this.memberModel.updateOne(
      { conversationId, userId },
      { $set: { lastReadMessageId, unreadCount: 0 } },
    );
    return { ok: true, conversationId, lastReadMessageId, userId };
  }

  async syncSince(userId: string, lastSyncAt: Date) {
    const memberships = await this.memberModel
      .find({ userId, deleted: false })
      .select('conversationId')
      .lean()
      .exec();
    const conversationIds = memberships.map(m => m.conversationId);
    if (!conversationIds.length) {
      return { messages: [] };
    }

    const messages = await this.messageModel
      .find({
        conversationId: { $in: conversationIds },
        createdAt: { $gt: lastSyncAt },
        deleted: false,
        deletedFor: { $ne: userId },
      })
      .sort({ createdAt: 1 })
      .limit(500)
      .lean()
      .exec();

    return { messages };
  }
}
