import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.connection.constant';
import { AiAgentModule } from 'src/modules/ai-agent/ai-agent.module';
import { ZaloModule } from 'src/modules/zalo/zalo.module';
import {
  ZaloChatHistoryEntity,
  ZaloChatHistorySchema,
} from 'src/modules/omnichat-bot/entities/zalo-chat-history.entity';
import { ZaloChatHistoryRepository } from 'src/modules/omnichat-bot/repositories/zalo-chat-history.repository';
import { OmnichatBotService } from 'src/modules/omnichat-bot/services/omnichat-bot.service';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: ZaloChatHistoryEntity.name, schema: ZaloChatHistorySchema }],
      DATABASE_CONNECTION_NAME,
    ),
    ZaloModule,
    AiAgentModule,
  ],
  providers: [ZaloChatHistoryRepository, OmnichatBotService],
  exports: [OmnichatBotService, ZaloChatHistoryRepository, MongooseModule],
})
export class OmnichatBotModule {}
