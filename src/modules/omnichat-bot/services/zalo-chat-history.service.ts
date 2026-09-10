import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/common/redis/services/redis.service';
import {
  OMNICHAT_BOT_HISTORY_LIMIT,
  OMNICHAT_BOT_HISTORY_TTL_SECONDS,
  OMNICHAT_BOT_REDIS_KEYS,
} from 'src/modules/omnichat-bot/constants/omnichat-bot.constant';
import { ZaloChatHistoryEntity } from 'src/modules/omnichat-bot/entities/zalo-chat-history.entity';
import { ENUM_ZALO_CHAT_ROLE } from 'src/modules/omnichat-bot/enums/omnichat-bot.enum';
import {
  IZaloChatHistoryItem,
  IZaloChatHistoryQuery,
  IZaloChatHistorySavePairInput,
  IZaloChatHistorySaveUserInput,
} from 'src/modules/omnichat-bot/interfaces/omnichat-bot.interface';
import { ZaloChatHistoryRepository } from 'src/modules/omnichat-bot/repositories/zalo-chat-history.repository';

@Injectable()
export class ZaloChatHistoryService {
  private readonly logger = new Logger(ZaloChatHistoryService.name);

  constructor(
    private readonly zaloChatHistoryRepository: ZaloChatHistoryRepository,
    private readonly redisService: RedisService,
  ) {}

  async getRecent(query: IZaloChatHistoryQuery): Promise<IZaloChatHistoryItem[]> {
    const cached = await this.readCache(query);
    if (cached) {
      return cached;
    }

    const items = await this.loadFromDatabase(query);
    await this.writeCache(query, items);
    return items;
  }

  async saveUserMessage(input: IZaloChatHistorySaveUserInput): Promise<void> {
    const now = new Date();
    await this.zaloChatHistoryRepository.createMany([
      this.toUserEntity(input, now),
    ]);
    await this.refreshCache(input);
  }

  async saveHistoryPair(input: IZaloChatHistorySavePairInput): Promise<void> {
    const now = new Date();
    await this.zaloChatHistoryRepository.createMany([
      this.toUserEntity(
        {
          userId: input.userId,
          threadId: input.threadId,
          isGroup: input.isGroup,
          content: input.userContent,
          senderName: input.senderName,
        },
        now,
      ),
      {
        userId: input.userId,
        threadId: input.threadId,
        role: ENUM_ZALO_CHAT_ROLE.ASSISTANT,
        content: input.assistantContent,
        timestamp: new Date(now.getTime() + 1),
      } as ZaloChatHistoryEntity,
    ]);
    await this.refreshCache(input);
  }

  private async refreshCache(query: IZaloChatHistoryQuery): Promise<void> {
    const items = await this.loadFromDatabase(query);
    await this.writeCache(query, items);
  }

  private async loadFromDatabase(
    query: IZaloChatHistoryQuery,
  ): Promise<IZaloChatHistoryItem[]> {
    const rows = await this.zaloChatHistoryRepository.findAll(
      query.isGroup ? { threadId: query.threadId } : { userId: query.userId },
      {
        order: { timestamp: -1 },
        paging: { limit: OMNICHAT_BOT_HISTORY_LIMIT },
      },
    );

    return rows.reverse().map((row) => ({
      role: row.role,
      content: row.content,
      senderName: row.senderName ?? undefined,
    }));
  }

  private async readCache(
    query: IZaloChatHistoryQuery,
  ): Promise<IZaloChatHistoryItem[] | null> {
    try {
      const cached = await this.redisService.get<IZaloChatHistoryItem[]>(
        this.cacheKey(query),
      );
      if (!Array.isArray(cached)) {
        return null;
      }
      return cached.slice(-OMNICHAT_BOT_HISTORY_LIMIT);
    } catch (error) {
      this.logger.warn(
        `Read chat history cache failed thread=${query.threadId}: ${String(error)}`,
      );
      return null;
    }
  }

  private async writeCache(
    query: IZaloChatHistoryQuery,
    items: IZaloChatHistoryItem[],
  ): Promise<void> {
    try {
      await this.redisService.set(
        this.cacheKey(query),
        items.slice(-OMNICHAT_BOT_HISTORY_LIMIT),
        OMNICHAT_BOT_HISTORY_TTL_SECONDS,
      );
    } catch (error) {
      this.logger.warn(
        `Write chat history cache failed thread=${query.threadId}: ${String(error)}`,
      );
    }
  }

  private cacheKey(query: IZaloChatHistoryQuery): string {
    return query.isGroup
      ? OMNICHAT_BOT_REDIS_KEYS.chatHistoryByThread(query.threadId)
      : OMNICHAT_BOT_REDIS_KEYS.chatHistoryByUser(query.userId);
  }

  private toUserEntity(
    input: IZaloChatHistorySaveUserInput,
    timestamp: Date,
  ): ZaloChatHistoryEntity {
    return {
      userId: input.userId,
      threadId: input.threadId,
      role: ENUM_ZALO_CHAT_ROLE.USER,
      content: input.content,
      senderName: input.senderName ?? null,
      timestamp,
    } as ZaloChatHistoryEntity;
  }
}
