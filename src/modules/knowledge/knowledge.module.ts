import { Module } from '@nestjs/common';
import { KnowledgeService } from 'src/modules/knowledge/services/knowledge.service';

@Module({
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
