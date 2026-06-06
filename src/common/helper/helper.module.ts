import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { HelperArrayService } from 'src/common/helper/services/helper.array.service';
import { HelperConvertFirebaseService } from 'src/common/helper/services/helper.convert.firebase.service';
import { HelperCurrencyService } from 'src/common/helper/services/helper.currency.service';
import { HelperDateService } from 'src/common/helper/services/helper.date.service';
import { HelperEncryptionService } from 'src/common/helper/services/helper.encryption.service';
import { HelperEqualObjectService } from 'src/common/helper/services/helper.equal.object.service';
import { HelperHashService } from 'src/common/helper/services/helper.hash.service';
import { HelperHttpService } from 'src/common/helper/services/helper.http.service';
import { HelperIdService } from 'src/common/helper/services/helper.id.service';
import { HelperPhoneService } from 'src/common/helper/services/helper.phone.service';
import { HelperStringService } from 'src/common/helper/services/helper.string.service';

@Global()
@Module({})
export class HelperModule {
    static forRoot(): DynamicModule {
        return {
            module: HelperModule,
            providers: [
                HelperArrayService,
                HelperDateService,
                HelperEncryptionService,
                HelperHashService,
                HelperStringService,
                HelperPhoneService,
                HelperCurrencyService,
                HelperEqualObjectService,
                HelperConvertFirebaseService,
                HelperIdService,
                HelperHttpService,
            ],
            exports: [
                HelperArrayService,
                HelperDateService,
                HelperEncryptionService,
                HelperHashService,
                HelperStringService,
                HelperPhoneService,
                HelperCurrencyService,
                HelperEqualObjectService,
                HelperConvertFirebaseService,
                HelperIdService,
                HelperHttpService,
            ],
            controllers: [],
            imports: [
                JwtModule.registerAsync({
                    inject: [ConfigService],
                    imports: [ConfigModule],
                    useFactory: (configService: ConfigService) => ({
                        secret:
                            configService.get<string>(
                                'helper.jwt.defaultSecretKey',
                            ) ?? 'omnichat-default-secret',
                        signOptions: {
                            expiresIn:
                                (configService.get<string>(
                                    'helper.jwt.defaultExpirationTime',
                                ) ?? '1h') as never,
                        },
                    }),
                }),
            ],
        };
    }
}
