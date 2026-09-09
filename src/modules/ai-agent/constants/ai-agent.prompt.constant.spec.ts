import {
  buildAiAgentUserPrompt,
  buildKnowledgeToolDescription,
  buildSystemPrompt,
} from 'src/modules/ai-agent/constants/ai-agent.prompt.constant';
import { ENUM_BOT_PROFILE_TONE } from 'src/modules/bot-profile/enums/bot-profile.enum';

describe('buildAiAgentUserPrompt', () => {
  it('includes sender name and group context', () => {
    const prompt = buildAiAgentUserPrompt({
      message: 'Trạm nào gần mình?',
      chatHistory: 'An: xin chào\nAssistant: chào An',
      senderName: 'An Nguyen',
      isGroup: true,
    });

    expect(prompt).toContain('Nguồn: tin nhắn nhóm');
    expect(prompt).toContain('Người gửi: An Nguyen');
    expect(prompt).toContain('Trạm nào gần mình?');
  });

  it('omits sender context when not provided', () => {
    const prompt = buildAiAgentUserPrompt({
      message: 'hello',
      chatHistory: '',
    });

    expect(prompt).toContain('(Chưa có lịch sử)');
    expect(prompt).not.toContain('Người gửi:');
    expect(prompt).not.toContain('tin nhắn nhóm');
  });
});

describe('buildSystemPrompt', () => {
  it('uses the shop bot name and does not mention SmartGo', () => {
    const prompt = buildSystemPrompt({
      botName: 'An Shop',
      tone: ENUM_BOT_PROFILE_TONE.FRIENDLY,
      systemPromptExtra: 'Ưu tiên size M',
    });

    expect(prompt).toContain('An Shop');
    expect(prompt).toContain('Ưu tiên size M');
    expect(prompt.toLowerCase()).not.toContain('smartgo');
    expect(buildKnowledgeToolDescription('An Shop')).toContain('An Shop');
    expect(buildKnowledgeToolDescription('An Shop').toLowerCase()).not.toContain(
      'smartgo',
    );
  });
});
