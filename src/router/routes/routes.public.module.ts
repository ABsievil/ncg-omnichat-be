import { Module } from '@nestjs/common';
import { AuthModule } from 'src/modules/auth/auth.module';
import { AuthPublicController } from 'src/modules/auth/controllers/auth.public.controller';
import { HealthController } from 'src/router/controllers/health.controller';

@Module({
  imports: [AuthModule],
  controllers: [HealthController, AuthPublicController],
})
export class RoutesPublicModule {}
