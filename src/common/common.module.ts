import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RequestModule } from 'src/common/request/request.module';
import {
  DatabaseModule,
  DatabaseOptionModule,
} from './database/database.module';
import { DatabaseOptionService } from './database/services/database.options.service';
import { DATABASE_CONNECTION_NAME } from './database/constants/database.constant';
import { EncryptionModule } from './encryption/encryption.module';
import { FileModule } from './file/file.module';
import { HelperModule } from './helper/helper.module';
import { MessageModule } from './message/message.module';
import { PaginationModule } from './pagination/pagination.module';
import { PubSubModule } from './pubsub/pubsub.module';
import { RedisModule } from './redis/redis.module';
import { ResponseModule } from './response/response.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      connectionName: DATABASE_CONNECTION_NAME,
      imports: [DatabaseOptionModule],
      inject: [DatabaseOptionService],
      useFactory: (databaseService: DatabaseOptionService) =>
        databaseService.createOptions(),
    }),
    ResponseModule,
    RequestModule.forRoot(),
    DatabaseModule.forRoot(),
    PaginationModule.forRoot(),
    HelperModule.forRoot(),
    MessageModule.forRoot(),
    RedisModule.forRoot(),
    EncryptionModule.forRoot(),
    FileModule.forRoot(),
    PubSubModule.forRoot(),
  ],
})
export class CommonModule {}
