import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { omit } from 'lodash';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ENUM_APP_ENVIRONMENT } from 'src/app/enums/app.enum';
import { ENCRYPTION_ENABLED_KEY } from 'src/common/encryption/decorators/encryption.decorator';
import { HelperEncryptionService } from 'src/common/helper/services/helper.encryption.service';

const DISABLE_ENCRYPTION_HEADER = 'X-Disable-Encryption';
@Injectable()
export class ResponseEncryptInterceptor implements NestInterceptor {
    private readonly logger = new Logger(ResponseEncryptInterceptor.name);
    private readonly encryptionKey: string;
    private readonly encryptionEnabled: boolean;
    private readonly useRandomIv: boolean;
    private readonly fallbackIv: string;
    private readonly appEnv: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly helperEncryptionService: HelperEncryptionService,
        private readonly reflector: Reflector
    ) {
        this.encryptionKey =
            this.configService.get<string>('encryption.aes.key');
        this.fallbackIv = this.configService.get<string>('encryption.aes.iv');
        this.encryptionEnabled = this.configService.get<boolean>(
            'encryption.aes.enable'
        );
        this.useRandomIv =
            this.configService.get<boolean>('encryption.aes.useRandomIv') ??
            true;
        this.appEnv = this.configService.get<string>('app.env');

        if (this.encryptionEnabled) {
            if (!this.encryptionKey) {
                this.logger.error(
                    'Response encryption is enabled but key is missing'
                );
            } else {
                // this.logger.log(
                //     `Response encryption configured - Random IV: ${this.useRandomIv ? 'Enabled' : 'Disabled'}`
                // );
            }
        }
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        // this.logger.debug('ResponseEncryptInterceptor is running');

        if (context.getType() !== 'http') {
            // this.logger.debug('Not an HTTP context, skipping encryption');
            return next.handle();
        }

        if (!this.encryptionEnabled) {
            // this.logger.debug('Encryption is disabled, skipping encryption');
            return next.handle();
        }

        const encryptionEnabled = this.reflector.getAllAndOverride<boolean>(
            ENCRYPTION_ENABLED_KEY,
            [context.getHandler(), context.getClass()]
        );

        if (encryptionEnabled === false) {
            // this.logger.debug(
            //     'Encryption is disabled for this route, skipping encryption'
            // );
            return next.handle();
        }

        const request = context.switchToHttp().getRequest();
        const disableEncryption =
            request.headers[DISABLE_ENCRYPTION_HEADER.toLowerCase()];

        if (
            (disableEncryption === 'true' || !disableEncryption) &&
            this.appEnv !== ENUM_APP_ENVIRONMENT.PRODUCTION
        ) {
            // this.logger.debug(
            //     'Encryption disabled by request header for testing'
            // );
            return next.handle();
        }

        return next.handle().pipe(
            map(async responseData => {
                try {
                    responseData = await responseData;

                    if (
                        !responseData ||
                        typeof responseData !== 'object' ||
                        !this.encryptionKey ||
                        !responseData.data
                    ) {
                        return responseData;
                    }

                    let encryptedResult: any;

                    if (this.useRandomIv) {
                        encryptedResult =
                            this.helperEncryptionService.aes256EncryptWithIv(
                                responseData?.data,
                                this.encryptionKey
                            );

                        this.logger.debug(
                            'Successfully encrypted response data with random IV'
                        );

                        return {
                            enc: true,
                            ...omit(responseData, ['data']),
                            data: encryptedResult.encryptedData,
                            iv: encryptedResult.iv,
                        };
                    }
                } catch (error) {
                    this.logger.error(
                        `Failed to encrypt response body: ${error.message}`
                    );
                    return responseData;
                }
            })
        );
    }
}
