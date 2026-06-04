import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerModule,
  type ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { AppMiddlewareModule } from 'src/app/app.middleware.module';
import { CommonModule } from 'src/common/common.module';
import { MIDDLEWARE_CONFIG_PATH } from 'src/common/request/constants/middleware-config-path.constant';
import configs from 'src/configs';
import { AppRouterModule } from 'src/router/router.module';

@Module({
  imports: [
    // Load config env global
    ConfigModule.forRoot({
      isGlobal: true,
      load: configs,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [
          {
            name: 'default',
            ttl:
              config.get<number>(MIDDLEWARE_CONFIG_PATH.THROTTLE_TTL) ?? 60_000,
            limit:
              config.get<number>(MIDDLEWARE_CONFIG_PATH.THROTTLE_LIMIT) ?? 100,
          },
        ],
      }),
    }),
    CommonModule,
    AppMiddlewareModule,
    AppRouterModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
