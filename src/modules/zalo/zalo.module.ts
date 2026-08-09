import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.connection.constant';
import { ShopModule } from 'src/modules/shop/shop.module';
import {
  ZaloSessionEntity,
  ZaloSessionSchema,
} from 'src/modules/zalo/entities/zalo-session.entity';
import { ZaloSessionError } from 'src/modules/zalo/errors/zalo.session.error';
import { ZaloService } from 'src/modules/zalo/services/zalo.service';

@Module({
  imports: [
    ShopModule,
    MongooseModule.forFeature(
      [{ name: ZaloSessionEntity.name, schema: ZaloSessionSchema }],
      DATABASE_CONNECTION_NAME,
    ),
  ],
  providers: [ZaloService, ZaloSessionError],
  exports: [ZaloService, ZaloSessionError, MongooseModule, ShopModule],
})
export class ZaloModule {}
