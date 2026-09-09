import { ENUM_ZALO_THREAD_TYPE } from 'src/modules/zalo/enums/zalo.enum';
import { IZaloMessage } from 'src/modules/zalo/interfaces/zalo.interface';
import { OMNICHAT_BOT_FALLBACK_MESSAGE } from 'src/modules/omnichat-bot/constants/omnichat-bot.constant';
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

jest.mock('src/modules/ai-agent/services/ai-agent.service', () => ({
  AiAgentService: class AiAgentService {},
}));

jest.mock('src/modules/zalo/services/zalo.service', () => ({
  ZaloService: class ZaloService {},
}));

describe('OmnichatBotService', () => {
  const historyRepo = {
    findAll: jest.fn(),
    createMany: jest.fn(),
  };
  const zaloService = {
    normalizeIncomingMessage: jest.fn(),
    getBotIdentity: jest.fn(),
    resolveSenderName: jest.fn(),
    sendMessage: jest.fn(),
  };
  const aiAgentService = {
    run: jest.fn(),
  };

  const service = new OmnichatBotService(
    historyRepo as never,
    zaloService as never,
    aiAgentService as never,
  );

  const inbound: IZaloMessage = {
    isSelf: false,
    threadId: 'thread-1',
    type: ENUM_ZALO_THREAD_TYPE.USER,
    userId: 'zalo-user-1',
    messageContent: 'Giá bao nhiêu?',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    historyRepo.findAll.mockResolvedValue([]);
    historyRepo.createMany.mockResolvedValue(undefined);
    zaloService.normalizeIncomingMessage.mockReturnValue(inbound);
    zaloService.resolveSenderName.mockResolvedValue('An');
    zaloService.sendMessage.mockResolvedValue(undefined);
    aiAgentService.run.mockResolvedValue('Giá 199k nhé');
  });

  it('loads history filtered by shopId + threadId', async () => {
    await service.handleIncomingMessage({}, 'shop-a');
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

    await service.handleIncomingMessage({}, 'shop-a');

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
    await service.handleIncomingMessage({}, 'shop-a');
    expect(zaloService.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: 'shop-a',
        message: OMNICHAT_BOT_FALLBACK_MESSAGE,
      }),
    );
    expect(historyRepo.createMany).toHaveBeenCalled();
  });

  it('skips self messages', async () => {
    zaloService.normalizeIncomingMessage.mockReturnValue({
      ...inbound,
      isSelf: true,
    });
    await service.handleIncomingMessage({}, 'shop-a');
    expect(aiAgentService.run).not.toHaveBeenCalled();
    expect(zaloService.sendMessage).not.toHaveBeenCalled();
  });
});
