import { Module } from '@nestjs/common';
import { BotProfileModule } from 'src/modules/bot-profile/bot-profile.module';
import { BotProfileAdminController } from 'src/modules/bot-profile/controllers/bot-profile.admin.controller';
import { ShopModule } from 'src/modules/shop/shop.module';
import { ShopAdminController } from 'src/modules/shop/controllers/shop.admin.controller';
import { UserModule } from 'src/modules/user/user.module';
import { ZaloModule } from 'src/modules/zalo/zalo.module';
import { ZaloAdminController } from 'src/modules/zalo/controllers/zalo.admin.controller';

@Module({
  imports: [ShopModule, ZaloModule, UserModule, BotProfileModule],
  controllers: [
    ShopAdminController,
    ZaloAdminController,
    BotProfileAdminController,
  ],
})
export class RoutesAdminModule {}
