import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { RequestContextInterceptor } from 'src/common/request/interceptors/request-context.interceptor';

/**
 * @description Decorator để gắn AsyncLocalStorage context
 */
export function UseRequestContext(): MethodDecorator {
    return applyDecorators(UseInterceptors(RequestContextInterceptor));
}
