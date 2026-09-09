import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/common/redis/services/redis.service';
import { buildSystemPrompt } from 'src/modules/ai-agent/constants/ai-agent.prompt.constant';
import { AiAgentService } from 'src/modules/ai-agent/services/ai-agent.service';
import { buildDefaultBotProfile } from 'src/modules/bot-profile/constants/bot-profile.constant';
import { BotProfileError } from 'src/modules/bot-profile/errors/bot-profile.error';
import { IBotProfileSnapshot } from 'src/modules/bot-profile/interfaces/bot-profile.interface';
import {
  OMNICHAT_BOT_AI_LABEL,
  OMNICHAT_BOT_DELAY_MAX_MS,
  OMNICHAT_BOT_DELAY_MIN_MS,
  OMNICHAT_BOT_FALLBACK_MESSAGE,
  OMNICHAT_BOT_GREETING_TTL_SECONDS,
  OMNICHAT_BOT_HISTORY_LIMIT,
  OMNICHAT_BOT_MAX_REPLIES_PER_MINUTE,
  OMNICHAT_BOT_OUTBOUND_ECHO_TTL_SECONDS,
  OMNICHAT_BOT_REDIS_KEYS,
  OMNICHAT_BOT_STRANGER_GREETING,
  OMNICHAT_BOT_THREAD_REPLY_INTERVAL_SECONDS,
} from 'src/modules/omnichat-bot/constants/omnichat-bot.constant';
import { ZaloChatHistoryEntity } from 'src/modules/omnichat-bot/entities/zalo-chat-history.entity';
import { ENUM_ZALO_CHAT_ROLE } from 'src/modules/omnichat-bot/enums/omnichat-bot.enum';
import { IOmnichatBotRuntime } from 'src/modules/omnichat-bot/interfaces/omnichat-bot.interface';
import { ZaloChatHistoryRepository } from 'src/modules/omnichat-bot/repositories/zalo-chat-history.repository';
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

@Injectable()
export class OmnichatBotService {
  private readonly logger = new Logger(OmnichatBotService.name);

  constructor(
    private readonly zaloChatHistoryRepository: ZaloChatHistoryRepository,
    private readonly zaloService: ZaloService,
    private readonly aiAgentService: AiAgentService,
    private readonly redisService: RedisService,
  ) {}

  async handleIncomingMessage(
    rawMessage: unknown,
    shopId: string,
    runtime?: IOmnichatBotRuntime,
  ): Promise<void> {
    const profile =
      runtime?.profile ?? buildDefaultBotProfile(shopId, 'Trợ lý shop');
    const now = runtime?.now ?? new Date();
    const skipDelay =
      runtime?.skipDelay === true || process.env.NODE_ENV === 'test';

    const message = this.zaloService.normalizeIncomingMessage(rawMessage);
    if (!message) {
      this.logger.debug('Skip non-text or invalid Zalo message');
      return;
    }

    if (!message.threadId || !message.userId) {
      this.logger.warn('Skip message missing threadId/userId');
      return;
    }

    if (message.isSelf) {
      await this.handleSelfMessage(shopId, message.threadId, profile);
      return;
    }

    if (!profile.enabled) {
      this.logger.debug(`Bot disabled shop=${shopId}`);
      return;
    }

    if (await this.isThreadMuted(shopId, message.threadId, profile)) {
      this.logger.debug(
        `Skip muted thread shop=${shopId} thread=${message.threadId}`,
      );
      return;
    }

    if (await this.isThreadPaused(shopId, message.threadId)) {
      this.logger.debug(
        `Skip paused thread shop=${shopId} thread=${message.threadId}`,
      );
      return;
    }

    if (!BotProfileError.isWithinWorkingHours(profile.workingHours, now)) {
      this.logger.debug(`Skip outside working hours shop=${shopId}`);
      return;
    }

    const isGroup = message.type === ENUM_ZALO_THREAD_TYPE.GROUP;
    let botNames: string[] = [];
    if (isGroup) {
      const identity = await this.zaloService.getBotIdentity(shopId);
      botNames = [profile.botName, ...identity.names].filter(Boolean);
      if (
        !isGroupBotAddressed({
          messageContent: message.messageContent,
          mentions: message.mentions,
          identity: {
            ...identity,
            names: botNames,
          },
        })
      ) {
        this.logger.debug(
          `Skip group message without bot address shop=${shopId} thread=${message.threadId} user=${message.userId}`,
        );
        return;
      }
    }

    if (this.isStopMessage(message.messageContent)) {
      const senderName = await this.resolveSenderName(shopId, message);
      await this.sendThreadReply({
        shopId,
        message,
        senderName,
        reply: ZALO_BLOCKED_MESSAGE,
        skipDelay: true,
        profile,
        now,
      });
      return;
    }

    const senderName = await this.resolveSenderName(shopId, message);
    this.logger.log(
      `Process Zalo message shop=${shopId} user=${message.userId} name=${senderName ?? '-'} thread=${message.threadId} type=${message.type}`,
    );

    const strangerReply = await this.maybeGreetStranger({
      shopId,
      userId: message.userId,
      profile,
    });
    if (strangerReply !== null) {
      if (strangerReply) {
        await this.sendThreadReply({
          shopId,
          message,
          senderName,
          reply: strangerReply,
          skipDelay,
          profile,
          now,
        });
      }
      return;
    }

    if (await this.isRateLimited(shopId, message.threadId, now, profile)) {
      this.logger.debug(
        `Skip rate-limited shop=${shopId} thread=${message.threadId}`,
      );
      return;
    }

    const history = await this.getHistory(shopId, message.threadId);
    const userMessage = isGroup
      ? stripBotAddressFromContent(message.messageContent, botNames)
      : message.messageContent;
    let reply = await this.aiAgentService.run({
      userId: message.userId,
      message: userMessage,
      history,
      senderName,
      isGroup,
      shopId,
      kbFilterShopId: shopId,
      shopName: profile.botName,
      systemPrompt: buildSystemPrompt({
        botName: profile.botName,
        tone: profile.tone,
        systemPromptExtra: profile.systemPromptExtra,
      }),
    });

    if (!reply?.trim()) {
      this.logger.warn(
        `Empty AI reply for user=${message.userId} shop=${shopId}`,
      );
      reply = profile.fallbackMessage || OMNICHAT_BOT_FALLBACK_MESSAGE;
    }

    reply = await this.applyAiLabel(shopId, message.threadId, reply, profile, now);

    await this.sendThreadReply({
      shopId,
      message,
      senderName,
      reply,
      skipDelay,
      profile,
      now,
    });

    await this.saveHistoryPair({
      shopId,
      userId: message.userId,
      threadId: message.threadId,
      userContent: message.messageContent,
      assistantContent: reply,
      senderName,
    });
  }

  private async handleSelfMessage(
    shopId: string,
    threadId: string,
    profile: IBotProfileSnapshot,
  ): Promise<void> {
    const echoKey = OMNICHAT_BOT_REDIS_KEYS.outbound(shopId, threadId);
    const isEcho = await this.redisService.exists(echoKey);
    if (isEcho) {
      this.logger.debug(`Skip bot echo shop=${shopId} thread=${threadId}`);
      return;
    }

    const ttlSeconds = Math.max(profile.pauseMinutes, 5) * 60;
    await this.redisService.set(
      OMNICHAT_BOT_REDIS_KEYS.pause(shopId, threadId),
      '1',
      ttlSeconds,
    );
    this.logger.log(
      `Paused bot shop=${shopId} thread=${threadId} for ${profile.pauseMinutes}m`,
    );
  }

  private async resolveSenderName(
    shopId: string,
    message: IZaloMessage,
  ): Promise<string | undefined> {
    return this.zaloService.resolveSenderName({
      shopId,
      userId: message.userId,
      type: message.type,
      userName: message.userName,
    });
  }

  private isStopMessage(content: string): boolean {
    const normalized = content.toLowerCase();
    return ZALO_STOP_KEYWORDS.some(keyword => normalized.includes(keyword));
  }

  private async isThreadMuted(
    shopId: string,
    threadId: string,
    profile: IBotProfileSnapshot,
  ): Promise<boolean> {
    if (profile.mutedThreadIds.includes(threadId)) {
      return true;
    }
    return (await this.redisService.exists(
      OMNICHAT_BOT_REDIS_KEYS.mute(shopId, threadId),
    )) > 0;
  }

  private async isThreadPaused(
    shopId: string,
    threadId: string,
  ): Promise<boolean> {
    return (
      (await this.redisService.exists(
        OMNICHAT_BOT_REDIS_KEYS.pause(shopId, threadId),
      )) > 0
    );
  }

  private async isRateLimited(
    shopId: string,
    threadId: string,
    now: Date,
    _profile: IBotProfileSnapshot,
  ): Promise<boolean> {
    const threadKey = OMNICHAT_BOT_REDIS_KEYS.threadRate(shopId, threadId);
    if ((await this.redisService.exists(threadKey)) > 0) {
      return true;
    }

    const minuteKey = this.minuteBucket(now);
    const shopKey = OMNICHAT_BOT_REDIS_KEYS.shopRate(shopId, minuteKey);
    const used = await this.readCounter(shopKey);
    if (used >= OMNICHAT_BOT_MAX_REPLIES_PER_MINUTE) {
      return true;
    }

    await this.redisService.set(
      threadKey,
      '1',
      OMNICHAT_BOT_THREAD_REPLY_INTERVAL_SECONDS,
    );
    const ttl = await this.redisService.ttl(shopKey);
    await this.redisService.set(shopKey, used + 1, ttl > 0 ? ttl : 70);
    return false;
  }

  private async maybeGreetStranger(input: {
    shopId: string;
    userId: string;
    profile: IBotProfileSnapshot;
  }): Promise<string | null> {
    if (input.profile.replyToStrangers) {
      return null;
    }

    const prior = await this.zaloChatHistoryRepository.findOne({
      shopId: input.shopId,
      userId: input.userId,
    });
    if (prior) {
      return null;
    }

    const greetedKey = OMNICHAT_BOT_REDIS_KEYS.greeted(
      input.shopId,
      input.userId,
    );
    if ((await this.redisService.exists(greetedKey)) > 0) {
      return '';
    }

    await this.redisService.set(greetedKey, '1', OMNICHAT_BOT_GREETING_TTL_SECONDS);
    return OMNICHAT_BOT_STRANGER_GREETING;
  }

  private async applyAiLabel(
    shopId: string,
    threadId: string,
    reply: string,
    profile: IBotProfileSnapshot,
    now: Date,
  ): Promise<string> {
    if (!profile.showAiLabel) {
      return reply;
    }
    const dayKey = this.dayBucket(now);
    const labelKey = OMNICHAT_BOT_REDIS_KEYS.aiLabel(shopId, threadId, dayKey);
    if ((await this.redisService.exists(labelKey)) > 0) {
      return reply;
    }
    await this.redisService.set(labelKey, '1', 60 * 60 * 26);
    return `${reply}\n\n(${OMNICHAT_BOT_AI_LABEL})`;
  }

  private async sendThreadReply(input: {
    shopId: string;
    message: IZaloMessage;
    senderName?: string;
    reply: string;
    skipDelay: boolean;
    profile: IBotProfileSnapshot;
    now: Date;
  }): Promise<void> {
    if (!input.skipDelay) {
      await this.zaloService.sendTypingEvent({
        shopId: input.shopId,
        threadId: input.message.threadId,
        type: input.message.type,
      });
      const span = OMNICHAT_BOT_DELAY_MAX_MS - OMNICHAT_BOT_DELAY_MIN_MS;
      const delayMs =
        OMNICHAT_BOT_DELAY_MIN_MS + Math.floor(Math.random() * (span + 1));
      await this.sleep(delayMs);
    }

    const isGroup = input.message.type === ENUM_ZALO_THREAD_TYPE.GROUP;
    const outgoing = isGroup
      ? buildGroupMentionReply({
          reply: input.reply,
          senderName: input.senderName,
          userId: input.message.userId,
        })
      : { message: input.reply };

    await this.redisService.set(
      OMNICHAT_BOT_REDIS_KEYS.outbound(input.shopId, input.message.threadId),
      '1',
      OMNICHAT_BOT_OUTBOUND_ECHO_TTL_SECONDS,
    );

    await this.zaloService.sendMessage({
      shopId: input.shopId,
      threadId: input.message.threadId,
      message: outgoing.message,
      type: input.message.type,
      quote: input.message.quote,
      mentions: outgoing.mentions,
    });
  }

  private async getHistory(shopId: string, threadId: string) {
    const rows = await this.zaloChatHistoryRepository.findAll(
      { shopId, threadId },
      {
        order: { timestamp: -1 },
        paging: { limit: OMNICHAT_BOT_HISTORY_LIMIT },
      },
    );

    return rows.reverse().map(row => ({
      role: row.role,
      content: row.content,
      senderName: row.senderName ?? undefined,
    }));
  }

  private async saveHistoryPair(input: {
    shopId: string;
    userId: string;
    threadId: string;
    userContent: string;
    assistantContent: string;
    senderName?: string;
  }): Promise<void> {
    const now = new Date();
    await this.zaloChatHistoryRepository.createMany([
      {
        shopId: input.shopId,
        userId: input.userId,
        threadId: input.threadId,
        role: ENUM_ZALO_CHAT_ROLE.USER,
        content: input.userContent,
        senderName: input.senderName ?? null,
        timestamp: now,
      } as ZaloChatHistoryEntity,
      {
        shopId: input.shopId,
        userId: input.userId,
        threadId: input.threadId,
        role: ENUM_ZALO_CHAT_ROLE.ASSISTANT,
        content: input.assistantContent,
        timestamp: new Date(now.getTime() + 1),
      } as ZaloChatHistoryEntity,
    ]);
  }

  private async readCounter(key: string): Promise<number> {
    const stored = await this.redisService.get<number>(key);
    if (typeof stored === 'number' && Number.isFinite(stored)) {
      return stored;
    }
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private minuteBucket(now: Date): string {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const pick = (type: string) =>
      parts.find(part => part.type === type)?.value ?? '00';
    return `${pick('year')}${pick('month')}${pick('day')}${pick('hour')}${pick('minute')}`;
  }

  private dayBucket(now: Date): string {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const pick = (type: string) =>
      parts.find(part => part.type === type)?.value ?? '00';
    return `${pick('year')}${pick('month')}${pick('day')}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
