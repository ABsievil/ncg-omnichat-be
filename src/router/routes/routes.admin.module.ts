import { Module } from '@nestjs/common';
import { ShopModule } from 'src/modules/shop/shop.module';
import { ShopAdminController } from 'src/modules/shop/controllers/shop.admin.controller';
import { ZaloModule } from 'src/modules/zalo/zalo.module';
import { ZaloAdminController } from 'src/modules/zalo/controllers/zalo.admin.controller';

@Module({
  imports: [ShopModule, ZaloModule],
  controllers: [ShopAdminController, ZaloAdminController],
})
export class RoutesAdminModule {}
