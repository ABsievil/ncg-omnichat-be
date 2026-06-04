import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { RequestDecryptInterceptor } from 'src/common/encryption/interceptors/request.decrypt.interceptor';
import { ResponseEncryptInterceptor } from 'src/common/encryption/interceptors/response.encrypt.interceptor';

export const ENCRYPTION_ENABLED_KEY = 'encryption_enabled';

export function UseDecryption(enable: boolean = true): MethodDecorator {
    if (enable) {
        return applyDecorators(
            SetMetadata(ENCRYPTION_ENABLED_KEY, true),
            UseInterceptors(
                RequestDecryptInterceptor
                // ResponseEncryptInterceptor
            )
        );
    } else {
        return SetMetadata(ENCRYPTION_ENABLED_KEY, false);
    }
}

export function EncryptionController(): ClassDecorator {
    return applyDecorators(
        SetMetadata(ENCRYPTION_ENABLED_KEY, true),
        UseInterceptors(
            // RequestDecryptInterceptor,
            ResponseEncryptInterceptor
        )
    );
}
