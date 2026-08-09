import {
  DatabaseEntity,
  DatabaseProp,
  DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { DatabaseEntityBase } from 'src/common/database/entities/database.entity';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { ENUM_SHOP_STATUS } from 'src/modules/shop/enums/shop.enum';

@DatabaseEntity({ collection: 'shops' })
export class ShopEntity extends DatabaseEntityBase {
  /** Stable slug used by APIs / FE (e.g. default, shop-a). */
  @DatabaseProp({
    required: true,
    unique: true,
    index: true,
    trim: true,
    lowercase: true,
    maxlength: 64,
  })
  code!: string;

  @DatabaseProp({
    required: true,
    trim: true,
    maxlength: 120,
  })
  name!: string;

  @DatabaseProp({
    required: false,
    type: String,
    default: null,
    maxlength: 500,
  })
  description?: string | null;

  @DatabaseProp({
    required: true,
    type: String,
    enum: Object.values(ENUM_SHOP_STATUS),
    default: ENUM_SHOP_STATUS.ACTIVE,
    index: true,
  })
  status!: ENUM_SHOP_STATUS;

  /**
   * Shops share one chatbot runtime.
   * Reserved for future per-shop overrides (prompt/KB) without splitting bot process.
   */
  @DatabaseProp({
    required: false,
    type: String,
    default: 'shared',
    index: true,
  })
  chatbotKey?: string;
}

export const ShopSchema = DatabaseSchema(ShopEntity);
export type ShopDoc = IDatabaseDocument<ShopEntity>;
