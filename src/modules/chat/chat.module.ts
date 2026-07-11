import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.connection.constant';
import {
  ChatMessageEntity,
  ChatMessageSchema,
} from 'src/modules/chat/entities/chat-message.entity';
import { ChatMessageRepository } from 'src/modules/chat/repositories/chat-message.repository';
import { ChatService } from 'src/modules/chat/services/chat.service';
import { ChatGateway } from 'src/modules/chat/gateways/chat.gateway';
import { ConversationModule } from 'src/modules/conversation/conversation.module';

@Module({
  imports: [
    ConversationModule,
    MongooseModule.forFeature(
      [{ name: ChatMessageEntity.name, schema: ChatMessageSchema }],
      DATABASE_CONNECTION_NAME,
    ),
  ],
  providers: [ChatMessageRepository, ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
