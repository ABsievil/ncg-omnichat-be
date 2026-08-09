import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectDatabaseModel } from 'src/common/database/decorators/database.decorator';
import { DatabaseRepositoryBase } from 'src/common/database/repositories/database.repository';
import {
  ZaloSessionDoc,
  ZaloSessionEntity,
} from 'src/modules/zalo/entities/zalo-session.entity';

@Injectable()
export class ZaloSessionRepository extends DatabaseRepositoryBase<
  ZaloSessionEntity,
  ZaloSessionDoc
> {
  constructor(
    @InjectDatabaseModel(ZaloSessionEntity.name)
    private readonly zaloSessionModel: Model<ZaloSessionEntity>,
  ) {
    super(zaloSessionModel);
  }
}
