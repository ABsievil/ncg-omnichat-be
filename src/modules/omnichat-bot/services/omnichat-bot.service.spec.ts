import { ENUM_ZALO_THREAD_TYPE } from 'src/modules/zalo/enums/zalo.enum';
import { IZaloMessage } from 'src/modules/zalo/interfaces/zalo.interface';
import { buildDefaultBotProfile } from 'src/modules/bot-profile/constants/bot-profile.constant';
import { IBotProfileSnapshot } from 'src/modules/bot-profile/interfaces/bot-profile.interface';
import {
  OMNICHAT_BOT_FALLBACK_MESSAGE,
  OMNICHAT_BOT_REDIS_KEYS,
  OMNICHAT_BOT_STRANGER_GREETING,
} from 'src/modules/omnichat-bot/constants/omnichat-bot.constant';
import { IOmnichatBotRuntime } from 'src/modules/omnichat-bot/interfaces/omnichat-bot.interface';
import { OmnichatBotService } from 'src/modules/omnichat-bot/services/omnichat-bot.service';

jest.mock('src/modules/ai-agent/services/ai-agent.service', () => ({
  AiAgentService: class AiAgentService {},
}));
jest.mock('src/modules/zalo/services/zalo.service', () => ({
  ZaloService: class ZaloService {},
}));
jest.mock(
  'src/modules/omnichat-bot/repositories/zalo-chat-history.repository',
  () => ({
    ZaloChatHistoryRepository: class ZaloChatHistoryRepository {},
  }),
);
jest.mock('src/modules/omnichat-bot/entities/zalo-chat-history.entity', () => ({
  ZaloChatHistoryEntity: class ZaloChatHistoryEntity {},
}));

describe('OmnichatBotService', () => {
  const historyRepo = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    createMany: jest.fn(),
  };
  const zaloService = {
    normalizeIncomingMessage: jest.fn(),
    getBotIdentity: jest.fn(),
    resolveSenderName: jest.fn(),
    sendMessage: jest.fn(),
    sendTypingEvent: jest.fn(),
  };
  const aiAgentService = {
    run: jest.fn(),
  };
  const redisStore = new Map<string, unknown>();
  const redisService = {
    exists: jest.fn(async (key: string) => (redisStore.has(key) ? 1 : 0)),
    set: jest.fn(async (key: string, value: unknown) => {
      redisStore.set(key, value);
    }),
    get: jest.fn(async (key: string) => redisStore.get(key) ?? null),
    ttl: jest.fn(async () => 70),
  };

  const service = new OmnichatBotService(
    historyRepo as never,
    zaloService as never,
    aiAgentService as never,
    redisService as never,
  );

  const inbound: IZaloMessage = {
    isSelf: false,
    threadId: 'thread-1',
    type: ENUM_ZALO_THREAD_TYPE.USER,
    userId: 'zalo-user-1',
    messageContent: 'Giá bao nhiêu?',
  };

  const profile = (
    overrides: Partial<IBotProfileSnapshot> = {},
  ): IBotProfileSnapshot => ({
    ...buildDefaultBotProfile('shop-a', 'An Shop'),
    ...overrides,
  });

  const runtime = (
    overrides: Partial<IOmnichatBotRuntime> = {},
  ): IOmnichatBotRuntime => ({
    profile: profile(),
    skipDelay: true,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    redisStore.clear();
    historyRepo.findAll.mockResolvedValue([]);
    historyRepo.findOne.mockResolvedValue(null);
    historyRepo.createMany.mockResolvedValue(undefined);
    zaloService.normalizeIncomingMessage.mockReturnValue(inbound);
    zaloService.resolveSenderName.mockResolvedValue('An');
    zaloService.sendMessage.mockResolvedValue(undefined);
    zaloService.sendTypingEvent.mockResolvedValue(undefined);
    aiAgentService.run.mockResolvedValue('Giá 199k nhé');
  });

  it('loads history filtered by shopId + threadId', async () => {
    await service.handleIncomingMessage({}, 'shop-a', runtime());
    expect(historyRepo.findAll).toHaveBeenCalledWith(
      { shopId: 'shop-a', threadId: 'thread-1' },
      expect.objectContaining({ paging: { limit: 10 } }),
    );
    expect(historyRepo.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          shopId: 'shop-a',
          userId: 'zalo-user-1',
          threadId: 'thread-1',
        }),
      ]),
    );
  });

  it('does not mix history across threads of the same customer', async () => {
    zaloService.normalizeIncomingMessage.mockReturnValue({
      ...inbound,
      threadId: 'group-9',
      type: ENUM_ZALO_THREAD_TYPE.GROUP,
      mentions: [{ pos: 0, uid: 'bot-1', len: 4 }],
    });
    zaloService.getBotIdentity.mockResolvedValue({
      ownId: 'bot-1',
      names: ['Bot'],
    });

    await service.handleIncomingMessage({}, 'shop-a', runtime());

    expect(historyRepo.findAll).toHaveBeenCalledWith(
      { shopId: 'shop-a', threadId: 'group-9' },
      expect.any(Object),
    );
    expect(historyRepo.findAll).not.toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'zalo-user-1' }),
      expect.any(Object),
    );
  });

  it('sends fallback instead of staying silent when AI returns empty', async () => {
    aiAgentService.run.mockResolvedValue('   ');
    await service.handleIncomingMessage({}, 'shop-a', runtime());
    expect(zaloService.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: 'shop-a',
        message: OMNICHAT_BOT_FALLBACK_MESSAGE,
      }),
    );
    expect(historyRepo.createMany).toHaveBeenCalled();
  });

  it('pauses the thread when the shop owner replies', async () => {
    zaloService.normalizeIncomingMessage.mockReturnValue({
      ...inbound,
      isSelf: true,
    });
    await service.handleIncomingMessage({}, 'shop-a', runtime());

    expect(aiAgentService.run).not.toHaveBeenCalled();
    expect(zaloService.sendMessage).not.toHaveBeenCalled();
    expect(redisStore.has(OMNICHAT_BOT_REDIS_KEYS.pause('shop-a', 'thread-1'))).toBe(
      true,
    );

    zaloService.normalizeIncomingMessage.mockReturnValue(inbound);
    await service.handleIncomingMessage({}, 'shop-a', runtime());
    expect(aiAgentService.run).not.toHaveBeenCalled();
    expect(zaloService.sendMessage).not.toHaveBeenCalled();
  });

  it('does not pause when the self message is the bot echo', async () => {
    redisStore.set(OMNICHAT_BOT_REDIS_KEYS.outbound('shop-a', 'thread-1'), '1');
    zaloService.normalizeIncomingMessage.mockReturnValue({
      ...inbound,
      isSelf: true,
    });
    await service.handleIncomingMessage({}, 'shop-a', runtime());

    expect(
      redisStore.has(OMNICHAT_BOT_REDIS_KEYS.pause('shop-a', 'thread-1')),
    ).toBe(false);
    expect(zaloService.sendMessage).not.toHaveBeenCalled();
  });

  it('skips AI when the thread is already paused', async () => {
    redisStore.set(OMNICHAT_BOT_REDIS_KEYS.pause('shop-a', 'thread-1'), '1');
    await service.handleIncomingMessage({}, 'shop-a', runtime());
    expect(aiAgentService.run).not.toHaveBeenCalled();
    expect(zaloService.sendMessage).not.toHaveBeenCalled();
  });

  it('skips when the bot is disabled', async () => {
    await service.handleIncomingMessage(
      {},
      'shop-a',
      runtime({ profile: profile({ enabled: false }) }),
    );
    expect(aiAgentService.run).not.toHaveBeenCalled();
    expect(zaloService.sendMessage).not.toHaveBeenCalled();
  });

  it('skips when the thread is rate-limited', async () => {
    redisStore.set(
      OMNICHAT_BOT_REDIS_KEYS.threadRate('shop-a', 'thread-1'),
      '1',
    );
    await service.handleIncomingMessage({}, 'shop-a', runtime());
    expect(aiAgentService.run).not.toHaveBeenCalled();
    expect(zaloService.sendMessage).not.toHaveBeenCalled();
  });

  it('greets strangers once when replyToStrangers is false', async () => {
    await service.handleIncomingMessage(
      {},
      'shop-a',
      runtime({ profile: profile({ replyToStrangers: false }) }),
    );

    expect(aiAgentService.run).not.toHaveBeenCalled();
    expect(zaloService.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: 'shop-a',
        message: OMNICHAT_BOT_STRANGER_GREETING,
      }),
    );

    zaloService.sendMessage.mockClear();
    await service.handleIncomingMessage(
      {},
      'shop-a',
      runtime({ profile: profile({ replyToStrangers: false }) }),
    );
    expect(zaloService.sendMessage).not.toHaveBeenCalled();
    expect(aiAgentService.run).not.toHaveBeenCalled();
  });

  it('skips outside working hours', async () => {
    await service.handleIncomingMessage(
      {},
      'shop-a',
      runtime({
        now: new Date('2026-09-09T16:00:00.000Z'),
        profile: profile({
          workingHours: {
            enabled: true,
            timezone: 'Asia/Ho_Chi_Minh',
            start: '08:00',
            end: '22:00',
          },
        }),
      }),
    );
    expect(aiAgentService.run).not.toHaveBeenCalled();
    expect(zaloService.sendMessage).not.toHaveBeenCalled();
  });
});
