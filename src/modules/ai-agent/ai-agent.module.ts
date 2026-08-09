import { Module } from '@nestjs/common';
import { KnowledgeModule } from 'src/modules/knowledge/knowledge.module';
import { AiAgentService } from 'src/modules/ai-agent/services/ai-agent.service';

@Module({
  imports: [KnowledgeModule],
  providers: [AiAgentService],
  exports: [AiAgentService],
})
export class AiAgentModule {}
