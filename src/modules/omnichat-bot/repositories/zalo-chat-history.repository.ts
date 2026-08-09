import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectDatabaseModel } from 'src/common/database/decorators/database.decorator';
import { DatabaseRepositoryBase } from 'src/common/database/repositories/database.repository';
import {
  ZaloChatHistoryDoc,
  ZaloChatHistoryEntity,
} from 'src/modules/omnichat-bot/entities/zalo-chat-history.entity';

@Injectable()
export class ZaloChatHistoryRepository extends DatabaseRepositoryBase<
  ZaloChatHistoryEntity,
  ZaloChatHistoryDoc
> {
  constructor(
    @InjectDatabaseModel(ZaloChatHistoryEntity.name)
    private readonly zaloChatHistoryModel: Model<ZaloChatHistoryEntity>,
  ) {
    super(zaloChatHistoryModel);
  }
}
