import { Module } from '@nestjs/common';
import { AuthModule } from 'src/modules/auth/auth.module';
import { AuthUserController } from 'src/modules/auth/controllers/auth.user.controller';
import { UserModule } from 'src/modules/user/user.module';
import { UserUserController } from 'src/modules/user/controllers/user.user.controller';
import { ContactModule } from 'src/modules/contact/contact.module';
import { ContactUserController } from 'src/modules/contact/controllers/contact.user.controller';
import { ConversationModule } from 'src/modules/conversation/conversation.module';
import { ConversationUserController } from 'src/modules/conversation/controllers/conversation.user.controller';
import { ChatModule } from 'src/modules/chat/chat.module';
import { ChatUserController } from 'src/modules/chat/controllers/chat.user.controller';

@Module({
  imports: [
    AuthModule,
    UserModule,
    ContactModule,
    ConversationModule,
    ChatModule,
  ],
  controllers: [
    AuthUserController,
    UserUserController,
    ContactUserController,
    ConversationUserController,
    ChatUserController,
  ],
})
export class RoutesUserModule {}
