import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppMiddlewareModule } from 'src/app/app.middleware.module';
import { CommonModule } from 'src/common/common.module';
import { EncryptionModule } from 'src/common/encryption/encryption.module';
import appConfig from 'src/configs/app.config';
import { AppRouterModule } from 'src/router/router.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    CommonModule,
    AppMiddlewareModule,
    EncryptionModule,
    AppRouterModule,
  ],
})
export class AppModule {}
