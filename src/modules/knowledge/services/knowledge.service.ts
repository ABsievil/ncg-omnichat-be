import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MilvusClient } from '@zilliz/milvus2-sdk-node';
import {
  KNOWLEDGE_DEFAULT_COLLECTION,
  KNOWLEDGE_DEFAULT_TOP_K,
} from 'src/modules/knowledge/constants/knowledge.constant';
import { IKnowledgeHit } from 'src/modules/knowledge/interfaces/knowledge.interface';

@Injectable()
export class KnowledgeService implements OnModuleDestroy {
  private readonly logger = new Logger(KnowledgeService.name);
  private client: MilvusClient | null = null;
  private embeddings: OpenAIEmbeddings | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleDestroy(): void {
    void this.client?.closeConnection();
    this.client = null;
  }

  async search(
    query: string,
    options?: { topK?: number; shopId?: string },
  ): Promise<IKnowledgeHit[]> {
    const limit =
      options?.topK ??
      this.configService.get<number>('ai.zilliz.topK') ??
      KNOWLEDGE_DEFAULT_TOP_K;
    const collection =
      this.configService.get<string>('ai.zilliz.collection') ??
      KNOWLEDGE_DEFAULT_COLLECTION;

    const client = this.getClient();
    const embeddings = this.getEmbeddings();
    const vector = await embeddings.embedQuery(query);

    const shopId = options?.shopId?.trim();
    const filter =
      shopId && /^[a-zA-Z0-9_-]+$/.test(shopId)
        ? `shopId == "${shopId}"`
        : undefined;

    const result = await client.search({
      collection_name: collection,
      vectors: [vector],
      limit,
      output_fields: ['text', 'metadata', 'type', 'pageContent'],
      ...(filter ? { filter } : {}),
    });

    const rows = (result.results ?? []) as Array<Record<string, any>>;
    return rows.map(row => {
      const metadata =
        typeof row.metadata === 'string'
          ? this.safeJsonParse(row.metadata)
          : (row.metadata ?? {});
      const pageContent =
        (typeof row.pageContent === 'string' && row.pageContent) ||
        (typeof row.text === 'string' && row.text) ||
        (typeof metadata?.text === 'string' && metadata.text) ||
        '';

      return {
        pageContent: String(pageContent),
        score: typeof row.score === 'number' ? row.score : undefined,
        metadata: {
          ...(metadata && typeof metadata === 'object' ? metadata : {}),
          type: row.type,
          text: row.text,
        },
      };
    });
  }

  formatHitsForTool(hits: IKnowledgeHit[]): string {
    if (!hits.length) {
      return '[]';
    }
    return JSON.stringify(
      hits.map(hit => ({
        pageContent: hit.pageContent,
        metadata: hit.metadata,
        score: hit.score,
      })),
      null,
      2,
    );
  }

  private getClient(): MilvusClient {
    if (this.client) {
      return this.client;
    }

    const address = this.configService.get<string>('ai.zilliz.uri') ?? '';
    const token = this.configService.get<string>('ai.zilliz.token') ?? '';
    if (!address || !token) {
      throw new Error(
        'ZILLIZ_URI and ZILLIZ_TOKEN are required for knowledge search',
      );
    }

    this.client = new MilvusClient({ address, token });
    return this.client;
  }

  private getEmbeddings(): OpenAIEmbeddings {
    if (this.embeddings) {
      return this.embeddings;
    }

    const apiKey = this.configService.get<string>('ai.dashscope.apiKey') ?? '';
    const baseURL =
      this.configService.get<string>('ai.dashscope.baseUrl') ??
      'https://dashscope.aliyuncs.com/compatible-mode/v1';
    const model =
      this.configService.get<string>('ai.embedModel') ?? 'text-embedding-v3';

    if (!apiKey) {
      throw new Error('DASHSCOPE_API_KEY is required for embeddings');
    }

    this.embeddings = new OpenAIEmbeddings({
      apiKey,
      model,
      configuration: { baseURL },
    });
    return this.embeddings;
  }

  private safeJsonParse(value: string): Record<string, unknown> {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : { text: value };
    } catch {
      this.logger.debug('metadata is not valid JSON, wrapping as text');
      return { text: value };
    }
  }
}
