import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectDatabaseModel } from 'src/common/database/decorators/database.decorator';
import { DatabaseRepositoryBase } from 'src/common/database/repositories/database.repository';
import {
  BotProfileDoc,
  BotProfileEntity,
} from 'src/modules/bot-profile/entities/bot-profile.entity';

@Injectable()
export class BotProfileRepository extends DatabaseRepositoryBase<
  BotProfileEntity,
  BotProfileDoc
> {
  constructor(
    @InjectDatabaseModel(BotProfileEntity.name)
    private readonly botProfileModel: Model<BotProfileEntity>,
  ) {
    super(botProfileModel);
  }
}
