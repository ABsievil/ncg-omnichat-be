import { ENUM_BOT_PROFILE_TONE } from 'src/modules/bot-profile/enums/bot-profile.enum';

const TONE_INSTRUCTIONS: Record<ENUM_BOT_PROFILE_TONE, string> = {
  [ENUM_BOT_PROFILE_TONE.FRIENDLY]:
    'Giọng thân thiện, xưng hô linh hoạt (mình/bạn).',
  [ENUM_BOT_PROFILE_TONE.FORMAL]:
    'Giọng lịch sự, trang trọng (dạ/vâng, anh/chị).',
  [ENUM_BOT_PROFILE_TONE.PLAYFUL]:
    'Giọng vui vẻ, dí dỏm, vẫn lịch sự, không tục.',
};

export function buildSystemPrompt(profile: {
  botName: string;
  tone: ENUM_BOT_PROFILE_TONE | string;
  systemPromptExtra?: string;
}): string {
  const tone =
    TONE_INSTRUCTIONS[profile.tone as ENUM_BOT_PROFILE_TONE] ??
    TONE_INSTRUCTIONS[ENUM_BOT_PROFILE_TONE.FRIENDLY];
  const extra = profile.systemPromptExtra?.trim();

  return `Bạn là ${profile.botName}, trợ lý AI của shop, trò chuyện với khách trên Zalo.

QUY TẮC BẮT BUỘC:
1. ${tone}
2. Chỉ gọi tool knowledge_base khi khách hỏi về sản phẩm, giá, địa chỉ, chính sách, dịch vụ của shop.
3. Với câu hỏi cần kiến thức shop: gọi tool đúng MỘT LẦN. TUYỆT ĐỐI KHÔNG gọi tool lần 2.
4. Đọc kết quả theo thứ tự: pageContent → metadata.text → metadata (JSON).
5. Nếu kết quả không liên quan hoặc trống, trả lời lịch sự rằng shop chưa có thông tin này và sẽ phản hồi sau. Không bịa.
6. Trả lời ngắn, tối đa 1–2 câu. Không cắt giữa câu. Không giải thích dài.
7. Chỉ dùng dữ liệu từ tool cho thông tin shop. Kiến thức chung chỉ dùng cho chào hỏi / làm rõ câu hỏi.
8. Khi có tên người gửi, xưng hô đúng tên. Không lặp tên ở đầu câu — hệ thống sẽ @mention họ trong nhóm.${
    extra ? `\n9. Hướng dẫn thêm từ chủ shop: ${extra}` : ''
  }`;
}

export function buildKnowledgeToolDescription(shopName?: string): string {
  const label = shopName?.trim() || 'shop';
  return `Tra cứu kiến thức của ${label} (FAQ, sản phẩm, giá, địa chỉ, chính sách). Chỉ gọi khi câu hỏi liên quan shop.`;
}

export function buildAiAgentUserPrompt(input: {
  message: string;
  chatHistory: string;
  senderName?: string;
  isGroup?: boolean;
}): string {
  const contextLines: string[] = [];
  if (input.isGroup) {
    contextLines.push('Nguồn: tin nhắn nhóm');
  }
  if (input.senderName) {
    contextLines.push(`Người gửi: ${input.senderName}`);
  }

  const contextBlock = contextLines.length
    ? `\n${contextLines.join('\n')}\n`
    : '';

  return `Lịch sử hội thoại gần đây:
${input.chatHistory || '(Chưa có lịch sử)'}
${contextBlock}
Tin nhắn hiện tại:
${input.message}`;
}
