export interface IKnowledgeHit {
  pageContent: string;
  score?: number;
  metadata?: Record<string, unknown>;
}
