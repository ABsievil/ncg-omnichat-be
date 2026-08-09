import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.connection.constant';
import { AiAgentService } from 'src/modules/ai-agent/services/ai-agent.service';
import {
  ZALO_BLOCKED_MESSAGE,
  ZALO_STOP_KEYWORDS,
} from 'src/modules/zalo/constants/zalo.constant';
import { IZaloMessage } from 'src/modules/zalo/interfaces/zalo.interface';
import { ZaloService } from 'src/modules/zalo/services/zalo.service';
import { OMNICHAT_BOT_HISTORY_LIMIT } from 'src/modules/omnichat-bot/constants/omnichat-bot.constant';
import {
  ZaloChatHistoryEntity,
} from 'src/modules/omnichat-bot/entities/zalo-chat-history.entity';
import { ENUM_ZALO_CHAT_ROLE } from 'src/modules/omnichat-bot/enums/omnichat-bot.enum';

@Injectable()
export class OmnichatBotService {
  private readonly logger = new Logger(OmnichatBotService.name);

  constructor(
    @InjectModel(ZaloChatHistoryEntity.name, DATABASE_CONNECTION_NAME)
    private readonly historyModel: Model<ZaloChatHistoryEntity>,
    private readonly zaloService: ZaloService,
    private readonly aiAgentService: AiAgentService,
  ) {}

  async handleIncomingMessage(rawMessage: unknown): Promise<void> {
    const message = this.zaloService.normalizeIncomingMessage(rawMessage);
    if (!message) {
      this.logger.debug('Skip non-text or invalid Zalo message');
      return;
    }

    if (message.isSelf) {
      this.logger.debug(`Skip self message thread=${message.threadId}`);
      return;
    }

    if (!message.threadId || !message.userId) {
      this.logger.warn('Skip message missing threadId/userId');
      return;
    }

    if (this.isStopMessage(message.messageContent)) {
      await this.zaloService.sendMessage({
        threadId: message.threadId,
        message: ZALO_BLOCKED_MESSAGE,
        type: message.type,
      });
      return;
    }

    const history = await this.getHistory(message.userId);
    const reply = await this.aiAgentService.run({
      userId: message.userId,
      message: message.messageContent,
      history,
    });

    if (!reply?.trim()) {
      this.logger.warn(`Empty AI reply for user=${message.userId}`);
      return;
    }

    await this.zaloService.sendMessage({
      threadId: message.threadId,
      message: reply,
      type: message.type,
    });

    await this.saveHistoryPair({
      userId: message.userId,
      threadId: message.threadId,
      userContent: message.messageContent,
      assistantContent: reply,
    });
  }

  private isStopMessage(content: string): boolean {
    const normalized = content.toLowerCase();
    return ZALO_STOP_KEYWORDS.some(keyword => normalized.includes(keyword));
  }

  private async getHistory(userId: string) {
    const rows = await this.historyModel
      .find({ userId, deleted: false })
      .sort({ timestamp: -1 })
      .limit(OMNICHAT_BOT_HISTORY_LIMIT)
      .lean()
      .exec();

    return rows
      .reverse()
      .map(row => ({
        role: row.role as ENUM_ZALO_CHAT_ROLE,
        content: row.content,
      }));
  }

  private async saveHistoryPair(input: {
    userId: string;
    threadId: string;
    userContent: string;
    assistantContent: string;
  }): Promise<void> {
    const now = new Date();
    await this.historyModel.insertMany([
      {
        userId: input.userId,
        threadId: input.threadId,
        role: ENUM_ZALO_CHAT_ROLE.USER,
        content: input.userContent,
        timestamp: now,
        deleted: false,
      },
      {
        userId: input.userId,
        threadId: input.threadId,
        role: ENUM_ZALO_CHAT_ROLE.ASSISTANT,
        content: input.assistantContent,
        timestamp: new Date(now.getTime() + 1),
        deleted: false,
      },
    ]);
  }
}
