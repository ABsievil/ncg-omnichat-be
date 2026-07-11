import { Injectable, Scope } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectDatabaseModel } from 'src/common/database/decorators/database.decorator';
import { DatabaseRepositoryBase } from 'src/common/database/repositories/database.repository';
import {
  ChatMessageDoc,
  ChatMessageEntity,
} from 'src/modules/chat/entities/chat-message.entity';

@Injectable({ scope: Scope.REQUEST })
export class ChatMessageRepository extends DatabaseRepositoryBase<
  ChatMessageEntity,
  ChatMessageDoc
> {
  constructor(
    @InjectDatabaseModel(ChatMessageEntity.name)
    model: Model<ChatMessageEntity>,
  ) {
    super(model);
  }
}
