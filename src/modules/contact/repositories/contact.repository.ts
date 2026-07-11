import { Injectable, Scope } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectDatabaseModel } from 'src/common/database/decorators/database.decorator';
import { DatabaseRepositoryBase } from 'src/common/database/repositories/database.repository';
import {
  ContactDoc,
  ContactEntity,
} from 'src/modules/contact/entities/contact.entity';

@Injectable({ scope: Scope.REQUEST })
export class ContactRepository extends DatabaseRepositoryBase<
  ContactEntity,
  ContactDoc
> {
  constructor(
    @InjectDatabaseModel(ContactEntity.name)
    model: Model<ContactEntity>,
  ) {
    super(model);
  }
}
