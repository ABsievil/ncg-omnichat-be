import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { ENUM_APP_ENVIRONMENT } from 'src/app/enums/app.enum';
import { DATABASE_CONFIG_PATH } from 'src/common/database/constants/database.constant';
import { IDatabaseOptionService } from 'src/common/database/interfaces/database.option-service.interface';

const APP_ENV_CONFIG_PATH = 'app.env';

@Injectable()
export class DatabaseOptionService implements IDatabaseOptionService {
    constructor(private readonly configService: ConfigService) {}

    createOptions(): MongooseModuleOptions {
        const env = this.configService.get<string>(APP_ENV_CONFIG_PATH);

        const url = this.configService.get<string>(DATABASE_CONFIG_PATH.URL);
        const debug = this.configService.get<boolean>(DATABASE_CONFIG_PATH.DEBUG);

        const timeoutOptions = this.configService.get<Record<string, number>>(
            DATABASE_CONFIG_PATH.TIMEOUT_OPTIONS
        );

        if (env !== ENUM_APP_ENVIRONMENT.PRODUCTION) {
            mongoose.set('debug', Boolean(debug));
        }

        const mongooseOptions: MongooseModuleOptions = {
            uri: url,
            autoCreate: env !== ENUM_APP_ENVIRONMENT.PRODUCTION,
            autoIndex: env !== ENUM_APP_ENVIRONMENT.PRODUCTION,
            ...(timeoutOptions ?? {}),
        };

        return mongooseOptions;
    }
}
