import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.connection.constant';
import {
  BotProfileEntity,
  BotProfileSchema,
} from 'src/modules/bot-profile/entities/bot-profile.entity';
import { BotProfileError } from 'src/modules/bot-profile/errors/bot-profile.error';
import { BotProfileRepository } from 'src/modules/bot-profile/repositories/bot-profile.repository';
import { BotProfileService } from 'src/modules/bot-profile/services/bot-profile.service';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: BotProfileEntity.name, schema: BotProfileSchema }],
      DATABASE_CONNECTION_NAME,
    ),
  ],
  providers: [BotProfileRepository, BotProfileService, BotProfileError],
  exports: [
    BotProfileService,
    BotProfileRepository,
    BotProfileError,
    MongooseModule,
  ],
})
export class BotProfileModule {}
