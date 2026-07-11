import { Injectable, Scope } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectDatabaseModel } from 'src/common/database/decorators/database.decorator';
import { DatabaseRepositoryBase } from 'src/common/database/repositories/database.repository';
import {
  ConversationDoc,
  ConversationEntity,
} from 'src/modules/conversation/entities/conversation.entity';
import {
  ConversationMemberDoc,
  ConversationMemberEntity,
} from 'src/modules/conversation/entities/conversation-member.entity';

@Injectable({ scope: Scope.REQUEST })
export class ConversationRepository extends DatabaseRepositoryBase<
  ConversationEntity,
  ConversationDoc
> {
  constructor(
    @InjectDatabaseModel(ConversationEntity.name)
    model: Model<ConversationEntity>,
  ) {
    super(model);
  }
}

@Injectable({ scope: Scope.REQUEST })
export class ConversationMemberRepository extends DatabaseRepositoryBase<
  ConversationMemberEntity,
  ConversationMemberDoc
> {
  constructor(
    @InjectDatabaseModel(ConversationMemberEntity.name)
    model: Model<ConversationMemberEntity>,
  ) {
    super(model);
  }
}
