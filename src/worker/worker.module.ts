import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateAppEnv } from 'src/app/dtos/app-env.dto';
import { CommonModule } from 'src/common/common.module';
import configs from 'src/configs';
import { OmnichatBotModule } from 'src/modules/omnichat-bot/omnichat-bot.module';
import { BotProfileModule } from 'src/modules/bot-profile/bot-profile.module';
import { ZaloModule } from 'src/modules/zalo/zalo.module';
import { ZaloListenerService } from 'src/worker/zalo-listener.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configs,
      validate: validateAppEnv,
    }),
    CommonModule,
    ZaloModule,
    OmnichatBotModule,
    BotProfileModule,
  ],
  providers: [ZaloListenerService],
})
export class WorkerModule {}
