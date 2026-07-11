import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.connection.constant';
import {
  ContactEntity,
  ContactSchema,
} from 'src/modules/contact/entities/contact.entity';
import { ContactRepository } from 'src/modules/contact/repositories/contact.repository';
import { ContactService } from 'src/modules/contact/services/contact.service';
import { UserModule } from 'src/modules/user/user.module';

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature(
      [{ name: ContactEntity.name, schema: ContactSchema }],
      DATABASE_CONNECTION_NAME,
    ),
  ],
  providers: [ContactRepository, ContactService],
  exports: [ContactService],
})
export class ContactModule {}
