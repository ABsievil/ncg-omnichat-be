import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.connection.constant';
import {
  ShopEntity,
  ShopSchema,
} from 'src/modules/shop/entities/shop.entity';
import { ShopError } from 'src/modules/shop/errors/shop.error';
import { ShopService } from 'src/modules/shop/services/shop.service';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: ShopEntity.name, schema: ShopSchema }],
      DATABASE_CONNECTION_NAME,
    ),
  ],
  providers: [ShopService, ShopError],
  exports: [ShopService, ShopError, MongooseModule],
})
export class ShopModule {}
