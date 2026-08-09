import { Injectable } from '@nestjs/common';
import { v4 as uuidV4 } from 'uuid';
import { ShopCreateRequestDto } from 'src/modules/shop/dtos/request/shop.create.request.dto';
import { ShopUpdateRequestDto } from 'src/modules/shop/dtos/request/shop.update.request.dto';
import { ShopGetResponseDto } from 'src/modules/shop/dtos/response/shop.get.response.dto';
import { ShopDoc, ShopEntity } from 'src/modules/shop/entities/shop.entity';
import { ENUM_SHOP_STATUS } from 'src/modules/shop/enums/shop.enum';
import { ShopError } from 'src/modules/shop/errors/shop.error';
import { ShopRepository } from 'src/modules/shop/repositories/shop.repository';

@Injectable()
export class ShopService {
  constructor(
    private readonly shopRepository: ShopRepository,
    private readonly shopError: ShopError,
  ) {}

  async create(dto: ShopCreateRequestDto): Promise<ShopGetResponseDto> {
    const code = await this.generateUniqueCode();
    const shop = await this.shopRepository.create({
      code,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      status: dto.status ?? ENUM_SHOP_STATUS.ACTIVE,
    } as ShopEntity);

    return this.mapGet(shop);
  }

  /** Auto code: shop_<10 hex chars>, e.g. shop_a1b2c3d4e5 */
  private async generateUniqueCode(): Promise<string> {
    for (let i = 0; i < 8; i++) {
      const code = `shop_${uuidV4().replace(/-/g, '').slice(0, 10)}`;
      const exists = await this.shopRepository.exists({ code });
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
    await this.shopRepository.save(shop);
    return this.mapGet(shop);
  }

  async getById(shopId: string): Promise<ShopGetResponseDto> {
    return this.mapGet(await this.findDocById(shopId));
  }

  async getByCode(code: string): Promise<ShopGetResponseDto> {
    const shop = await this.shopRepository.findOne({
      code: code.trim().toLowerCase(),
    });
    if (!shop) {
      this.shopError.throwNotFound();
    }
    return this.mapGet(shop);
  }

  async list(): Promise<ShopGetResponseDto[]> {
    const shops = await this.shopRepository.findAll(
      {},
      { order: { createdAt: 1 } },
    );
    return shops.map(shop => this.mapGet(shop));
  }

  async assertActiveShop(shopId: string): Promise<ShopDoc> {
    const shop = await this.findDocById(shopId);
    this.shopError.assertActive(shop.status);
    return shop;
  }

  async softDelete(shopId: string): Promise<void> {
    await this.findDocById(shopId);
    await this.shopRepository.softDelete({ _id: shopId });
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
      chatbotKey: doc.chatbotKey ?? null,
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
    const shop = await this.shopRepository.findOneById(shopId);
    if (!shop) {
      this.shopError.throwNotFound();
    }
    return shop;
  }
}
