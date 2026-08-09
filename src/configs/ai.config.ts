import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  dashscope: {
    baseUrl:
      process.env.DASHSCOPE_BASE_URL ??
      'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: process.env.DASHSCOPE_API_KEY ?? '',
  },
  chatModel: process.env.AI_CHAT_MODEL ?? 'qwen3.7-plus',
  embedModel: process.env.AI_EMBED_MODEL ?? 'text-embedding-v3',
  maxIterations: parseInt(process.env.AI_MAX_ITERATIONS ?? '3', 10),
  temperature: parseFloat(process.env.AI_TEMPERATURE ?? '0.3'),
  maxTokens: parseInt(process.env.AI_MAX_TOKENS ?? '500', 10),
  zilliz: {
    uri: process.env.ZILLIZ_URI ?? '',
    token: process.env.ZILLIZ_TOKEN ?? '',
    collection: process.env.ZILLIZ_COLLECTION ?? 'smart_go_knowledge_v5',
    dim: parseInt(process.env.ZILLIZ_DIM ?? '1024', 10),
    topK: parseInt(process.env.ZILLIZ_TOP_K ?? '4', 10),
  },
}));
