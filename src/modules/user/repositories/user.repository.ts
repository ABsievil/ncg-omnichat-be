import { Injectable, Scope } from '@nestjs/common';
import {
  InjectDatabaseModel,
} from 'src/common/database/decorators/database.decorator';
import { DatabaseRepositoryBase } from 'src/common/database/repositories/database.repository';
import {
  UserDoc,
  UserEntity,
} from 'src/modules/user/entities/user.entity';
import { Model } from 'mongoose';

@Injectable({ scope: Scope.REQUEST })
export class UserRepository extends DatabaseRepositoryBase<
  UserEntity,
  UserDoc
> {
  constructor(
    @InjectDatabaseModel(UserEntity.name)
    private readonly userModel: Model<UserEntity>,
  ) {
    super(userModel);
  }
}
