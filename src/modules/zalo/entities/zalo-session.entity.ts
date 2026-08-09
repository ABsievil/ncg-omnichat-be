import {
  DatabaseEntity,
  DatabaseProp,
  DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { DatabaseEntityBase } from 'src/common/database/entities/database.entity';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { ENUM_ZALO_SESSION_STATUS } from 'src/modules/zalo/enums/zalo.enum';

/**
 * One Zalo personal account per shop (shopId is the unique key).
 */
@DatabaseEntity({ collection: 'zalo_sessions' })
export class ZaloSessionEntity extends DatabaseEntityBase {
  @DatabaseProp({
    required: true,
    unique: true,
    index: true,
    trim: true,
  })
  shopId!: string;

  /** AES-encrypted cookie JSON (or plaintext when encryption disabled) */
  @DatabaseProp({ required: true, select: false })
  cookieEncrypted!: string;

  @DatabaseProp({ required: false, type: String, default: null, select: false })
  cookieIv?: string | null;

  @DatabaseProp({ required: true, select: false })
  imei!: string;

  @DatabaseProp({ required: true, select: false })
  userAgent!: string;

  @DatabaseProp({ required: false, type: String, default: null })
  proxy?: string | null;

  @DatabaseProp({ required: false, type: String, default: null })
  ownId?: string | null;

  @DatabaseProp({
    required: true,
    type: String,
    enum: Object.values(ENUM_ZALO_SESSION_STATUS),
    default: ENUM_ZALO_SESSION_STATUS.PENDING_QR,
    index: true,
  })
  status!: ENUM_ZALO_SESSION_STATUS;

  @DatabaseProp({ required: false, type: Date, default: null })
  lastLoginAt?: Date | null;
}

export const ZaloSessionSchema = DatabaseSchema(ZaloSessionEntity);
export type ZaloSessionDoc = IDatabaseDocument<ZaloSessionEntity>;
