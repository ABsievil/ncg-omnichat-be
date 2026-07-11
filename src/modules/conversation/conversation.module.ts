import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.connection.constant';
import {
  ConversationEntity,
  ConversationSchema,
} from 'src/modules/conversation/entities/conversation.entity';
import {
  ConversationMemberEntity,
  ConversationMemberSchema,
} from 'src/modules/conversation/entities/conversation-member.entity';
import {
  ConversationMemberRepository,
  ConversationRepository,
} from 'src/modules/conversation/repositories/conversation.repository';
import { ConversationService } from 'src/modules/conversation/services/conversation.service';
import { UserModule } from 'src/modules/user/user.module';

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature(
      [
        { name: ConversationEntity.name, schema: ConversationSchema },
        {
          name: ConversationMemberEntity.name,
          schema: ConversationMemberSchema,
        },
      ],
      DATABASE_CONNECTION_NAME,
    ),
  ],
  providers: [
    ConversationRepository,
    ConversationMemberRepository,
    ConversationService,
  ],
  exports: [ConversationService, MongooseModule],
})
export class ConversationModule {}
