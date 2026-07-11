import {
  DatabaseEntity,
  DatabaseProp,
  DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { DatabaseEntityBase } from 'src/common/database/entities/database.entity';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { ENUM_CONTACT_STATUS } from 'src/modules/contact/enums/contact.enum';

@DatabaseEntity({ collection: 'contacts' })
export class ContactEntity extends DatabaseEntityBase {
  @DatabaseProp({ required: true, index: true })
  userId: string;

  @DatabaseProp({ required: true, index: true })
  contactId: string;

  @DatabaseProp({
    required: true,
    enum: ENUM_CONTACT_STATUS,
    default: ENUM_CONTACT_STATUS.PENDING,
    index: true,
  })
  status: ENUM_CONTACT_STATUS;
}

export const ContactSchema = DatabaseSchema(ContactEntity);
export type ContactDoc = IDatabaseDocument<ContactEntity>;

ContactSchema.index({ userId: 1, contactId: 1 }, { unique: true });
ContactSchema.index({ userId: 1, status: 1 });
