import {
  DatabaseEntity,
  DatabaseProp,
  DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { DatabaseEntityBase } from 'src/common/database/entities/database.entity';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import {
  ENUM_USER_GENDER,
  ENUM_USER_ROLE,
} from 'src/modules/user/enums/user.enum';

@DatabaseEntity({ collection: 'users' })
export class UserEntity extends DatabaseEntityBase {
  @DatabaseProp({
    required: true,
    unique: true,
    index: true,
    trim: true,
  })
  phone!: string;

  /** Shop the user belongs to. Null only for platform admin without shop. */
  @DatabaseProp({
    required: false,
    type: String,
    default: null,
    index: true,
  })
  shopId?: string | null;

  @DatabaseProp({
    required: true,
    type: String,
    enum: Object.values(ENUM_USER_ROLE),
    default: ENUM_USER_ROLE.USER,
    index: true,
  })
  role!: ENUM_USER_ROLE;

  @DatabaseProp({
    required: false,
    select: false,
  })
  passwordHash?: string;

  @DatabaseProp({
    required: true,
    trim: true,
    maxlength: 80,
  })
  displayName!: string;

  @DatabaseProp({
    required: false,
    type: String,
    default: null,
  })
  avatarUrl?: string | null;

  @DatabaseProp({
    required: false,
    type: String,
    default: null,
  })
  coverUrl?: string | null;

  @DatabaseProp({
    required: false,
    default: '',
    maxlength: 200,
  })
  bio?: string;

  @DatabaseProp({
    required: false,
    type: String,
    enum: Object.values(ENUM_USER_GENDER),
    default: ENUM_USER_GENDER.UNKNOWN,
  })
  gender?: ENUM_USER_GENDER;

  @DatabaseProp({
    required: false,
    type: Date,
    default: null,
  })
  dob?: Date | null;

  @DatabaseProp({
    required: false,
    default: '',
    maxlength: 120,
  })
  statusText?: string;

  @DatabaseProp({
    required: false,
    type: Date,
    index: true,
  })
  lastActiveAt?: Date;
}

export const UserSchema = DatabaseSchema(UserEntity);
export type UserDoc = IDatabaseDocument<UserEntity>;

UserSchema.index({ displayName: 'text' });
