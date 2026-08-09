import { Module } from '@nestjs/common';
import { ZaloModule } from 'src/modules/zalo/zalo.module';
import { ZaloAdminController } from 'src/modules/zalo/controllers/zalo.admin.controller';

@Module({
  imports: [ZaloModule],
  controllers: [ZaloAdminController],
})
export class RoutesAdminModule {}
