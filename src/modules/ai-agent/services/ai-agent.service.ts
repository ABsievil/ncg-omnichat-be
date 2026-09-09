import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { createAgent, tool } from 'langchain';
import { z } from 'zod';
import {
  AI_AGENT_DEFAULT_MAX_ITERATIONS,
  AI_AGENT_DEFAULT_MAX_TOKENS,
  AI_AGENT_DEFAULT_TEMPERATURE,
  AI_AGENT_TOOL_NAME,
} from 'src/modules/ai-agent/constants/ai-agent.constant';
import {
  buildAiAgentUserPrompt,
  buildKnowledgeToolDescription,
  buildSystemPrompt,
} from 'src/modules/ai-agent/constants/ai-agent.prompt.constant';
import { IAiAgentInput } from 'src/modules/ai-agent/interfaces/ai-agent.interface';
import { ENUM_BOT_PROFILE_TONE } from 'src/modules/bot-profile/enums/bot-profile.enum';
import { KnowledgeService } from 'src/modules/knowledge/services/knowledge.service';

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly knowledgeService: KnowledgeService,
  ) {}

  async run(input: IAiAgentInput): Promise<string> {
    const llm = this.createChatModel();
    const knowledgeTool = this.createKnowledgeTool({
      shopId: input.kbFilterShopId ?? input.shopId,
      shopName: input.shopName,
    });
    const maxIterations =
      this.configService.get<number>('ai.maxIterations') ??
      AI_AGENT_DEFAULT_MAX_ITERATIONS;

    const agent = createAgent({
      model: llm,
      tools: [knowledgeTool],
      systemPrompt:
        input.systemPrompt ??
        buildSystemPrompt({
          botName: input.shopName || 'Trợ lý shop',
          tone: ENUM_BOT_PROFILE_TONE.FRIENDLY,
        }),
    });

    const chatHistory = input.history
      .map((item) => {
        const speaker =
          item.role === 'user' ? item.senderName || 'User' : 'Assistant';
        return `${speaker}: ${item.content}`;
      })
      .join('\n');

    const prompt = buildAiAgentUserPrompt({
      message: input.message,
      chatHistory,
      senderName: input.senderName,
      isGroup: input.isGroup,
    });

    try {
      const result = await agent.invoke(
        {
          messages: [{ role: 'user', content: prompt }],
        },
        {
          recursionLimit: Math.max(maxIterations * 2, 6),
        },
      );

      return this.extractText(result);
    } catch (error) {
      this.logger.error(`AI agent failed: ${String(error)}`);
      return 'Xin lỗi, mình đang gặp chút trục trặc kỹ thuật. Bạn thử lại giúp mình sau nhé.';
    }
  }

  private createChatModel(): ChatOpenAI {
    const apiKey = this.configService.get<string>('ai.dashscope.apiKey') ?? '';
    const baseURL =
      this.configService.get<string>('ai.dashscope.baseUrl') ??
      'https://dashscope.aliyuncs.com/compatible-mode/v1';
    const model =
      this.configService.get<string>('ai.chatModel') ?? 'qwen3.7-plus';
    const temperature =
      this.configService.get<number>('ai.temperature') ??
      AI_AGENT_DEFAULT_TEMPERATURE;
    const maxTokens =
      this.configService.get<number>('ai.maxTokens') ??
      AI_AGENT_DEFAULT_MAX_TOKENS;

    if (!apiKey) {
      throw new Error('DASHSCOPE_API_KEY is required for AI agent');
    }

    return new ChatOpenAI({
      apiKey,
      model,
      temperature,
      maxTokens,
      configuration: { baseURL },
    });
  }

  private createKnowledgeTool(input: { shopId?: string; shopName?: string }) {
    const shopId = input.shopId;
    return tool(
      async ({ query }: { query: string }) => {
        const hits = await this.knowledgeService.search(query, {
          shopId,
        });
        return this.knowledgeService.formatHitsForTool(hits);
      },
      {
        name: AI_AGENT_TOOL_NAME,
        description: buildKnowledgeToolDescription(input.shopName),
        schema: z.object({
          query: z
            .string()
            .describe('Câu truy vấn tiếng Việt có dấu để tìm trong knowledge base'),
        }),
      },
    );
  }

  private extractText(result: unknown): string {
    if (!result || typeof result !== 'object') {
      return String(result ?? '');
    }

    const messages = (result as { messages?: unknown[] }).messages;
    if (!Array.isArray(messages) || !messages.length) {
      return '';
    }

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i] as {
        content?: unknown;
        kwargs?: { content?: unknown };
      };
      const content = msg?.content ?? msg?.kwargs?.content;
      if (typeof content === 'string' && content.trim()) {
        return content.trim().slice(0, 500);
      }
      if (Array.isArray(content)) {
        const text = content
          .map(part => {
            if (typeof part === 'string') {
              return part;
            }
            if (part && typeof part === 'object' && 'text' in part) {
              return String((part as { text: unknown }).text ?? '');
            }
            return '';
          })
          .join('')
          .trim();
        if (text) {
          return text.slice(0, 500);
        }
      }
    }

    return '';
  }
}
