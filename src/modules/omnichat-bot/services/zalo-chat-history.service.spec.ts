jest.mock('uuid', () => ({ v4: () => 'test-id' }));

import {
  OMNICHAT_BOT_HISTORY_LIMIT,
  OMNICHAT_BOT_HISTORY_TTL_SECONDS,
  OMNICHAT_BOT_REDIS_KEYS,
} from 'src/modules/omnichat-bot/constants/omnichat-bot.constant';
import { ENUM_ZALO_CHAT_ROLE } from 'src/modules/omnichat-bot/enums/omnichat-bot.enum';
import { ZaloChatHistoryService } from 'src/modules/omnichat-bot/services/zalo-chat-history.service';

describe('ZaloChatHistoryService', () => {
  const threadQuery = {
    userId: 'user-1',
    threadId: 'group-9',
    isGroup: true,
  };

  const userQuery = {
    userId: 'user-1',
    threadId: 'user-1',
    isGroup: false,
  };

  const mongoRows = [
    {
      role: ENUM_ZALO_CHAT_ROLE.ASSISTANT,
      content: 'ok',
      senderName: null,
    },
    {
      role: ENUM_ZALO_CHAT_ROLE.USER,
      content: 'đi ăn không',
      senderName: 'An',
    },
  ];

  let repository: { findAll: jest.Mock; createMany: jest.Mock };
  let redisService: { get: jest.Mock; set: jest.Mock };
  let service: ZaloChatHistoryService;

  beforeEach(() => {
    repository = {
      findAll: jest.fn().mockResolvedValue(mongoRows),
      createMany: jest.fn().mockResolvedValue({ acknowledged: true }),
    };
    redisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };
    service = new ZaloChatHistoryService(
      repository as never,
      redisService as never,
    );
  });

  describe('getRecent', () => {
    it('returns Redis cache when present', async () => {
      const cached = [
        { role: ENUM_ZALO_CHAT_ROLE.USER, content: 'cached', senderName: 'An' },
      ];
      redisService.get.mockResolvedValue(cached);

      await expect(service.getRecent(threadQuery)).resolves.toEqual(cached);
      expect(repository.findAll).not.toHaveBeenCalled();
      expect(redisService.get).toHaveBeenCalledWith(
        OMNICHAT_BOT_REDIS_KEYS.chatHistoryByThread('group-9'),
      );
    });

    it('loads Mongo by threadId for groups and backfills Redis', async () => {
      const items = await service.getRecent(threadQuery);

      expect(repository.findAll).toHaveBeenCalledWith(
        { threadId: 'group-9' },
        {
          order: { timestamp: -1 },
          paging: { limit: OMNICHAT_BOT_HISTORY_LIMIT },
        },
      );
      expect(items).toEqual([
        {
          role: ENUM_ZALO_CHAT_ROLE.USER,
          content: 'đi ăn không',
          senderName: 'An',
        },
        { role: ENUM_ZALO_CHAT_ROLE.ASSISTANT, content: 'ok', senderName: undefined },
      ]);
      expect(redisService.set).toHaveBeenCalledWith(
        OMNICHAT_BOT_REDIS_KEYS.chatHistoryByThread('group-9'),
        items,
        OMNICHAT_BOT_HISTORY_TTL_SECONDS,
      );
    });

    it('loads Mongo by userId for 1-1 chats', async () => {
      await service.getRecent(userQuery);

      expect(repository.findAll).toHaveBeenCalledWith(
        { userId: 'user-1' },
        expect.any(Object),
      );
      expect(redisService.get).toHaveBeenCalledWith(
        OMNICHAT_BOT_REDIS_KEYS.chatHistoryByUser('user-1'),
      );
    });
  });

  describe('saveUserMessage', () => {
    it('writes the user turn to Mongo and refreshes Redis', async () => {
      await service.saveUserMessage({
        ...threadQuery,
        content: 'mai đi Đà Nẵng',
        senderName: 'An',
      });

      expect(repository.createMany).toHaveBeenCalledWith([
        expect.objectContaining({
          userId: 'user-1',
          threadId: 'group-9',
          role: ENUM_ZALO_CHAT_ROLE.USER,
          content: 'mai đi Đà Nẵng',
          senderName: 'An',
        }),
      ]);
      expect(repository.findAll).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalledWith(
        OMNICHAT_BOT_REDIS_KEYS.chatHistoryByThread('group-9'),
        expect.any(Array),
        OMNICHAT_BOT_HISTORY_TTL_SECONDS,
      );
    });
  });

  describe('saveHistoryPair', () => {
    it('writes user + assistant turns and refreshes Redis', async () => {
      await service.saveHistoryPair({
        ...userQuery,
        userContent: 'hello',
        assistantContent: 'hi',
        senderName: 'An',
      });

      expect(repository.createMany).toHaveBeenCalledWith([
        expect.objectContaining({
          role: ENUM_ZALO_CHAT_ROLE.USER,
          content: 'hello',
        }),
        expect.objectContaining({
          role: ENUM_ZALO_CHAT_ROLE.ASSISTANT,
          content: 'hi',
        }),
      ]);
      expect(redisService.set).toHaveBeenCalledWith(
        OMNICHAT_BOT_REDIS_KEYS.chatHistoryByUser('user-1'),
        expect.any(Array),
        OMNICHAT_BOT_HISTORY_TTL_SECONDS,
      );
    });
  });
});
