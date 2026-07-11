import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.connection.constant';
import {
  UserEntity,
  UserSchema,
} from 'src/modules/user/entities/user.entity';
import { UserRepository } from 'src/modules/user/repositories/user.repository';
import { UserService } from 'src/modules/user/services/user.service';
@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: UserEntity.name, schema: UserSchema }],
      DATABASE_CONNECTION_NAME,
    ),
  ],
  providers: [UserRepository, UserService],
  exports: [UserService, UserRepository, MongooseModule],
})
export class UserModule {}
