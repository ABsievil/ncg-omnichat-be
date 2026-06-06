import {
    BadRequestException,
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { ENUM_APP_ENVIRONMENT } from 'src/app/enums/app.enum';
import { ENCRYPTION_ENABLED_KEY } from 'src/common/encryption/decorators/encryption.decorator';
import { HelperEncryptionService } from 'src/common/helper/services/helper.encryption.service';

@Injectable()
export class RequestDecryptInterceptor implements NestInterceptor {
    private readonly logger = new Logger(RequestDecryptInterceptor.name);
    private readonly encryptionKeyClient: string;
    private readonly fallbackIv: string;
    private readonly encryptionEnabled: boolean;
    private readonly appEnv: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly helperEncryptionService: HelperEncryptionService,
        private readonly reflector: Reflector
    ) {
        this.encryptionKeyClient =
            this.configService.get<string>('encryption.aes.keyClient') ?? '';
        this.fallbackIv =
            this.configService.get<string>('encryption.aes.iv') ?? '';
        this.encryptionEnabled =
            this.configService.get<boolean>('encryption.aes.enable') ?? false;
        this.appEnv = this.configService.get<string>('app.env') ?? '';

        // this.logger.log(`Encryption enabled: ${this.encryptionEnabled}`);
        if (this.encryptionEnabled) {
            if (!this.encryptionKeyClient) {
                this.logger.error('Encryption is enabled but key is missing');
            } else {
                // this.logger.log('Encryption configuration verified');
            }
        }
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        // this.logger.debug('RequestDecryptInterceptor is running');

        if (context.getType() !== 'http') {
            // this.logger.debug('Not an HTTP context, skipping decryption');
            return next.handle();
        }

        if (!this.encryptionEnabled) {
            // this.logger.debug('Encryption is disabled, skipping decryption');
            return next.handle();
        }

        const encryptionEnabled = this.reflector.getAllAndOverride<boolean>(
            ENCRYPTION_ENABLED_KEY,
            [context.getHandler(), context.getClass()]
        );

        if (encryptionEnabled === false) {
            // this.logger.debug(
            //     'Encryption is disabled for this route, skipping decryption'
            // );
            return next.handle();
        }

        const request = context.switchToHttp().getRequest<Request>();

        if (!request.body) {
            // this.logger.debug('No request body, nothing to decrypt');
            return next.handle();
        }

        const isProduction = this.appEnv === ENUM_APP_ENVIRONMENT.PRODUCTION;

        if (
            (request.body.data || request.body.encryptedData) &&
            (request.body.enc === true || request.body.enc === 'true')
        ) {
            try {
                if (!this.encryptionKeyClient) {
                    throw new Error('Encryption key is missing');
                }

                let decryptedData: any;
                if (this.fallbackIv) {
                    // this.logger.debug(
                    //     'Found IV in request, using random IV decryption'
                    // );

                    decryptedData =
                        this.helperEncryptionService.aes256DecryptWithIv(
                            request.body.data || request.body.encryptedData,
                            this.encryptionKeyClient,
                            this.fallbackIv
                        );
                }

                request.body = decryptedData;
                // this.logger.debug('Successfully decrypted request body');
            } catch (error) {
                this.logger.error(
                    `Failed to decrypt request body: ${error.message}`
                );

                throw new BadRequestException({
                    statusCode: 400,
                    message: 'Invalid encrypted data format',
                });
            }
        } else {
            // this.logger.debug('No encrypted data found in request body');

            // In production, enforce that all request bodies must be encrypted
            if (isProduction) {
                // this.logger.warn(
                //     'Unencrypted request received in production environment'
                // );
                throw new BadRequestException({
                    statusCode: 400,
                    message: 'Encrypted request body is required in production',
                });
            }
        }

        return next.handle();
    }
}
