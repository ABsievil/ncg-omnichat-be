import { Module } from '@nestjs/common';
import { HealthController } from 'src/router/controllers/health.controller';

@Module({
  controllers: [HealthController],
})
export class RoutesPublicModule {}
