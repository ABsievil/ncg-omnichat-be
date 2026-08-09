import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidV4 } from 'uuid';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.connection.constant';
import {
  SHOP_DEFAULT_CODE,
  SHOP_DEFAULT_NAME,
} from 'src/modules/shop/constants/shop.constant';
import { ShopCreateRequestDto } from 'src/modules/shop/dtos/request/shop.create.request.dto';
import { ShopUpdateRequestDto } from 'src/modules/shop/dtos/request/shop.update.request.dto';
import { ShopGetResponseDto } from 'src/modules/shop/dtos/response/shop.get.response.dto';
import { ShopDoc, ShopEntity } from 'src/modules/shop/entities/shop.entity';
import { ENUM_SHOP_STATUS } from 'src/modules/shop/enums/shop.enum';
import { ShopError } from 'src/modules/shop/errors/shop.error';

@Injectable()
export class ShopService implements OnModuleInit {
  private readonly logger = new Logger(ShopService.name);

  constructor(
    @InjectModel(ShopEntity.name, DATABASE_CONNECTION_NAME)
    private readonly shopModel: Model<ShopEntity>,
    private readonly shopError: ShopError,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureDefaultShop();
  }

  async ensureDefaultShop(): Promise<ShopDoc> {
    const existing = await this.shopModel
      .findOne({ code: SHOP_DEFAULT_CODE, deleted: false })
      .exec();
    if (existing) {
      return existing as ShopDoc;
    }

    const created = await this.shopModel.create({
      code: SHOP_DEFAULT_CODE,
      name: SHOP_DEFAULT_NAME,
      description: 'Auto-created default shop',
      status: ENUM_SHOP_STATUS.ACTIVE,
      chatbotKey: 'shared',
    });
    this.logger.log(`Created default shop id=${created._id}`);
    return created as ShopDoc;
  }

  async getDefaultShopId(): Promise<string> {
    const shop = await this.ensureDefaultShop();
    return String(shop._id);
  }

  async create(dto: ShopCreateRequestDto): Promise<ShopGetResponseDto> {
    const code = await this.generateUniqueCode();
    const shop = await this.shopModel.create({
      code,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      status: dto.status ?? ENUM_SHOP_STATUS.ACTIVE,
      chatbotKey: 'shared',
    });

    return this.mapGet(shop);
  }

  /** Auto code: shop_<10 hex chars>, e.g. shop_a1b2c3d4e5 */
  private async generateUniqueCode(): Promise<string> {
    for (let i = 0; i < 8; i++) {
      const code = `shop_${uuidV4().replace(/-/g, '').slice(0, 10)}`;
      const exists = await this.shopModel.exists({ code, deleted: false }).exec();
      if (!exists) {
        return code;
      }
    }
    this.shopError.throwCodeExists();
  }

  async update(
    shopId: string,
    dto: ShopUpdateRequestDto,
  ): Promise<ShopGetResponseDto> {
    const shop = await this.findDocById(shopId);
    if (dto.name !== undefined) {
      shop.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      shop.description = dto.description?.trim() || null;
    }
    if (dto.status !== undefined) {
      shop.status = dto.status;
    }
    await shop.save();
    return this.mapGet(shop);
  }

  async getById(shopId: string): Promise<ShopGetResponseDto> {
    return this.mapGet(await this.findDocById(shopId));
  }

  async getByCode(code: string): Promise<ShopGetResponseDto> {
    const shop = await this.shopModel
      .findOne({ code: code.trim().toLowerCase(), deleted: false })
      .exec();
    if (!shop) {
      this.shopError.throwNotFound();
    }
    return this.mapGet(shop);
  }

  async list(): Promise<ShopGetResponseDto[]> {
    const shops = await this.shopModel
      .find({ deleted: false })
      .sort({ createdAt: 1 })
      .exec();
    return shops.map(shop => this.mapGet(shop));
  }

  async assertActiveShop(shopId: string): Promise<ShopDoc> {
    const shop = await this.findDocById(shopId);
    this.shopError.assertActive(shop.status);
    return shop;
  }

  async softDelete(shopId: string): Promise<void> {
    const shop = await this.findDocById(shopId);
    if (shop.code === SHOP_DEFAULT_CODE) {
      this.shopError.throwCannotDeleteDefault();
    }
    shop.deleted = true;
    shop.deletedAt = new Date();
    await shop.save();
  }

  mapGet(shop: ShopDoc | ShopEntity): ShopGetResponseDto {
    const doc = shop as ShopDoc;
    return {
      _id: String(doc._id),
      createdAt: doc.createdAt as Date,
      updatedAt: (doc.updatedAt as Date) ?? (doc.createdAt as Date),
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy,
      deleted: !!doc.deleted,
      deletedAt: doc.deletedAt,
      deletedBy: doc.deletedBy,
      code: doc.code,
      name: doc.name,
      description: doc.description ?? null,
      status: doc.status,
      chatbotKey: doc.chatbotKey ?? 'shared',
    };
  }

  mapGetData(shop: ShopGetResponseDto) {
    return {
      shop,
      createdBy: [] as [],
      updatedBy: [] as [],
    };
  }

  mapListData(shops: ShopGetResponseDto[]) {
    return {
      shops,
      createdBy: [] as [],
      updatedBy: [] as [],
    };
  }

  private async findDocById(shopId: string): Promise<ShopDoc> {
    const shop = await this.shopModel
      .findOne({ _id: shopId, deleted: false })
      .exec();
    if (!shop) {
      this.shopError.throwNotFound();
    }
    return shop as ShopDoc;
  }
}
