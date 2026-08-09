import { Module } from '@nestjs/common';
import { AuthModule } from 'src/modules/auth/auth.module';
import { AuthUserController } from 'src/modules/auth/controllers/auth.user.controller';
import { UserModule } from 'src/modules/user/user.module';
import { UserUserController } from 'src/modules/user/controllers/user.user.controller';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [AuthUserController, UserUserController],
})
export class RoutesUserModule {}
