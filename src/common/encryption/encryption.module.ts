import { DynamicModule, Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ChecksumInterceptor } from 'src/common/encryption/interceptors/checksum.interceptor';
import { RequestDecryptInterceptor } from 'src/common/encryption/interceptors/request.decrypt.interceptor';
import { ResponseEncryptInterceptor } from 'src/common/encryption/interceptors/response.encrypt.interceptor';

@Global()
@Module({})
export class EncryptionModule {
    static forRoot(): DynamicModule {
        return {
            module: EncryptionModule,
            imports: [ConfigModule],
            providers: [
                {
                    provide: APP_INTERCEPTOR,
                    useClass: RequestDecryptInterceptor,
                },
                {
                    provide: APP_INTERCEPTOR,
                    useClass: ResponseEncryptInterceptor,
                },
                {
                    provide: APP_INTERCEPTOR,
                    useClass: ChecksumInterceptor,
                },
            ],
            exports: [],
            controllers: [],
        };
    }
}
