import { Module } from '@nestjs/common';
import { ShopModule } from 'src/modules/shop/shop.module';
import { ShopAdminController } from 'src/modules/shop/controllers/shop.admin.controller';
import { UserModule } from 'src/modules/user/user.module';
import { ZaloModule } from 'src/modules/zalo/zalo.module';
import { ZaloAdminController } from 'src/modules/zalo/controllers/zalo.admin.controller';

@Module({
  imports: [ShopModule, ZaloModule, UserModule],
  controllers: [ShopAdminController, ZaloAdminController],
})
export class RoutesAdminModule {}
