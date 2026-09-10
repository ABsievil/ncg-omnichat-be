import { Injectable, Logger } from '@nestjs/common';
import { AiAgentService } from 'src/modules/ai-agent/services/ai-agent.service';
import {
  ZALO_BLOCKED_MESSAGE,
  ZALO_STOP_KEYWORDS,
} from 'src/modules/zalo/constants/zalo.constant';
import { ENUM_ZALO_THREAD_TYPE } from 'src/modules/zalo/enums/zalo.enum';
import { IZaloMessage } from 'src/modules/zalo/interfaces/zalo.interface';
import {
  isGroupBotAddressed,
  stripBotAddressFromContent,
} from 'src/modules/zalo/mappers/zalo-group-address.mapper';
import { buildGroupMentionReply } from 'src/modules/zalo/mappers/zalo-message.mapper';
import { ZaloService } from 'src/modules/zalo/services/zalo.service';
import { ZaloChatHistoryService } from 'src/modules/omnichat-bot/services/zalo-chat-history.service';

@Injectable()
export class OmnichatBotService {
  private readonly logger = new Logger(OmnichatBotService.name);

  constructor(
    private readonly zaloChatHistoryService: ZaloChatHistoryService,
    private readonly zaloService: ZaloService,
    private readonly aiAgentService: AiAgentService,
  ) {}

  /**
   * Handle an incoming Zalo message for a shop.
   * `shopId` selects which Zalo account sends the reply.
   */
  async handleIncomingMessage(
    rawMessage: unknown,
    shopId: string,
  ): Promise<void> {
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

    const isGroup = message.type === ENUM_ZALO_THREAD_TYPE.GROUP;
    let botNames: string[] = [];
    let isAddressed = true;
    if (isGroup) {
      const identity = await this.zaloService.getBotIdentity(shopId);
      botNames = identity.names;
      isAddressed = isGroupBotAddressed({
        messageContent: message.messageContent,
        mentions: message.mentions,
        identity,
      });
    }

    const senderName = await this.zaloService.resolveSenderName({
      shopId,
      userId: message.userId,
      type: message.type,
      userName: message.userName,
    });

    if (isGroup && !isAddressed) {
      await this.zaloChatHistoryService.saveUserMessage({
        userId: message.userId,
        threadId: message.threadId,
        isGroup,
        content: message.messageContent,
        senderName,
      });
      this.logger.debug(
        `Persist group message without bot address shop=${shopId} thread=${message.threadId} user=${message.userId} name=${senderName ?? '-'}`,
      );
      return;
    }

    this.logger.log(
      `Process Zalo message shop=${shopId} user=${message.userId} name=${senderName ?? '-'} thread=${message.threadId} type=${message.type}`,
    );

    if (this.isStopMessage(message.messageContent)) {
      await this.sendThreadReply({
        shopId,
        message,
        senderName,
        reply: ZALO_BLOCKED_MESSAGE,
      });
      return;
    }

    const history = await this.zaloChatHistoryService.getRecent({
      userId: message.userId,
      threadId: message.threadId,
      isGroup,
    });
    const userMessage = isGroup
      ? stripBotAddressFromContent(message.messageContent, botNames)
      : message.messageContent;
    const reply = await this.aiAgentService.run({
      userId: message.userId,
      message: userMessage,
      history,
      senderName,
      isGroup,
    });

    if (!reply?.trim()) {
      this.logger.warn(`Empty AI reply for user=${message.userId}`);
      return;
    }

    await this.sendThreadReply({
      shopId,
      message,
      senderName,
      reply,
    });

    await this.zaloChatHistoryService.saveHistoryPair({
      userId: message.userId,
      threadId: message.threadId,
      isGroup,
      userContent: message.messageContent,
      assistantContent: reply,
      senderName,
    });
  }

  private isStopMessage(content: string): boolean {
    const normalized = content.toLowerCase();
    return ZALO_STOP_KEYWORDS.some((keyword) => normalized.includes(keyword));
  }

  private async sendThreadReply(input: {
    shopId: string;
    message: IZaloMessage;
    senderName?: string;
    reply: string;
  }): Promise<void> {
    const isGroup = input.message.type === ENUM_ZALO_THREAD_TYPE.GROUP;
    const outgoing = isGroup
      ? buildGroupMentionReply({
          reply: input.reply,
          senderName: input.senderName,
          userId: input.message.userId,
        })
      : { message: input.reply };

    await this.zaloService.sendMessage({
      shopId: input.shopId,
      threadId: input.message.threadId,
      message: outgoing.message,
      type: input.message.type,
      quote: input.message.quote,
      mentions: outgoing.mentions,
    });
  }
}
