import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectDatabaseModel } from 'src/common/database/decorators/database.decorator';
import { DatabaseRepositoryBase } from 'src/common/database/repositories/database.repository';
import {
  ShopDoc,
  ShopEntity,
} from 'src/modules/shop/entities/shop.entity';

@Injectable()
export class ShopRepository extends DatabaseRepositoryBase<
  ShopEntity,
  ShopDoc
> {
  constructor(
    @InjectDatabaseModel(ShopEntity.name)
    private readonly shopModel: Model<ShopEntity>,
  ) {
    super(shopModel);
  }
}
