import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { ChecksumInterceptor } from 'src/common/encryption/interceptors/checksum.interceptor';

export function UseChecksum(): MethodDecorator {
    return applyDecorators(UseInterceptors(ChecksumInterceptor));
}
