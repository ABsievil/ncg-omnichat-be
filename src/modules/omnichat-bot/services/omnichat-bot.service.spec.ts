jest.mock('src/modules/ai-agent/services/ai-agent.service', () => ({
  AiAgentService: class AiAgentService {},
}));
jest.mock('src/modules/omnichat-bot/services/zalo-chat-history.service', () => ({
  ZaloChatHistoryService: class ZaloChatHistoryService {},
}));
jest.mock('src/modules/zalo/services/zalo.service', () => ({
  ZaloService: class ZaloService {},
}));

import { ENUM_ZALO_THREAD_TYPE } from 'src/modules/zalo/enums/zalo.enum';
import { IZaloMessage } from 'src/modules/zalo/interfaces/zalo.interface';
import { OmnichatBotService } from 'src/modules/omnichat-bot/services/omnichat-bot.service';

describe('OmnichatBotService', () => {
  const shopId = 'shop-1';
  const groupMessage: IZaloMessage = {
    isSelf: false,
    threadId: 'group-9',
    type: ENUM_ZALO_THREAD_TYPE.GROUP,
    userId: 'user-1',
    userName: 'An',
    messageContent: 'mai đi Đà Nẵng',
  };

  let historyService: {
    getRecent: jest.Mock;
    saveUserMessage: jest.Mock;
    saveHistoryPair: jest.Mock;
  };
  let zaloService: {
    normalizeIncomingMessage: jest.Mock;
    getBotIdentity: jest.Mock;
    resolveSenderName: jest.Mock;
    sendMessage: jest.Mock;
  };
  let aiAgentService: { run: jest.Mock };
  let service: OmnichatBotService;

  beforeEach(() => {
    historyService = {
      getRecent: jest.fn().mockResolvedValue([]),
      saveUserMessage: jest.fn().mockResolvedValue(undefined),
      saveHistoryPair: jest.fn().mockResolvedValue(undefined),
    };
    zaloService = {
      normalizeIncomingMessage: jest.fn().mockReturnValue(groupMessage),
      getBotIdentity: jest.fn().mockResolvedValue({
        ownId: 'bot-1',
        names: ['SmartGo Bot'],
      }),
      resolveSenderName: jest.fn().mockResolvedValue('An'),
      sendMessage: jest.fn().mockResolvedValue(undefined),
    };
    aiAgentService = {
      run: jest.fn().mockResolvedValue('ok mình ghi nhận'),
    };
    service = new OmnichatBotService(
      historyService as never,
      zaloService as never,
      aiAgentService as never,
    );
  });

  it('persists an unmentioned group message to history and does not reply', async () => {
    await service.handleIncomingMessage({}, shopId);

    expect(historyService.saveUserMessage).toHaveBeenCalledWith({
      userId: 'user-1',
      threadId: 'group-9',
      isGroup: true,
      content: 'mai đi Đà Nẵng',
      senderName: 'An',
    });
    expect(aiAgentService.run).not.toHaveBeenCalled();
    expect(zaloService.sendMessage).not.toHaveBeenCalled();
    expect(historyService.saveHistoryPair).not.toHaveBeenCalled();
  });

  it('replies when the bot is mentioned and saves the pair after using history', async () => {
    const addressed: IZaloMessage = {
      ...groupMessage,
      messageContent: '@SmartGo Bot đặt vé giúp',
      mentions: [{ uid: 'bot-1', pos: 0, len: 13 }],
    };
    zaloService.normalizeIncomingMessage.mockReturnValue(addressed);
    historyService.getRecent.mockResolvedValue([
      { role: 'user', content: 'mai đi Đà Nẵng', senderName: 'An' },
    ]);

    await service.handleIncomingMessage({}, shopId);

    expect(historyService.getRecent).toHaveBeenCalledWith({
      userId: 'user-1',
      threadId: 'group-9',
      isGroup: true,
    });
    expect(aiAgentService.run).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'đặt vé giúp',
        history: [
          { role: 'user', content: 'mai đi Đà Nẵng', senderName: 'An' },
        ],
        isGroup: true,
      }),
    );
    expect(zaloService.sendMessage).toHaveBeenCalled();
    expect(historyService.saveHistoryPair).toHaveBeenCalledWith({
      userId: 'user-1',
      threadId: 'group-9',
      isGroup: true,
      userContent: '@SmartGo Bot đặt vé giúp',
      assistantContent: 'ok mình ghi nhận',
      senderName: 'An',
    });
    expect(historyService.saveUserMessage).not.toHaveBeenCalled();
  });

  it('does not persist self or invalid messages', async () => {
    zaloService.normalizeIncomingMessage.mockReturnValueOnce(null);
    await service.handleIncomingMessage({}, shopId);

    zaloService.normalizeIncomingMessage.mockReturnValueOnce({
      ...groupMessage,
      isSelf: true,
    });
    await service.handleIncomingMessage({}, shopId);

    expect(historyService.saveUserMessage).not.toHaveBeenCalled();
    expect(historyService.saveHistoryPair).not.toHaveBeenCalled();
  });
});
