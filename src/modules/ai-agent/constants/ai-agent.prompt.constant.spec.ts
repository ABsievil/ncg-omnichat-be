import { buildAiAgentUserPrompt } from 'src/modules/ai-agent/constants/ai-agent.prompt.constant';

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
