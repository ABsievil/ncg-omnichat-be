import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    RequestTimeoutException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import {
    REQUEST_CUSTOM_TIMEOUT_META_KEY,
    REQUEST_CUSTOM_TIMEOUT_VALUE_META_KEY,
    REQUEST_SKIP_TIMEOUT_META_KEY,
} from 'src/common/request/constants/request.constant';
import { ENUM_REQUEST_STATUS_CODE_ERROR } from 'src/common/request/enums/request.status-code.enum';

@Injectable()
export class RequestTimeoutInterceptor
    implements NestInterceptor<Promise<any>>
{
    private readonly maxTimeoutInSecond: number;

    constructor(
        private readonly configService: ConfigService,
        private readonly reflector: Reflector
    ) {
        this.maxTimeoutInSecond =
            this.configService.get<number>('middleware.timeout') ?? 30;
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<void> {
        if (context.getType() !== 'http') {
            return next.handle();
        }

        const skipTimeout = this.reflector.getAllAndOverride<boolean>(
            REQUEST_SKIP_TIMEOUT_META_KEY,
            [context.getHandler(), context.getClass()]
        );
        if (skipTimeout) {
            return next.handle();
        }

        // Nest @Sse() sets metadata key `__sse__`
        const isSse = this.reflector.getAllAndOverride<boolean>('__sse__', [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isSse) {
            return next.handle();
        }

        const customTimeout = this.reflector.get<boolean>(
            REQUEST_CUSTOM_TIMEOUT_META_KEY,
            context.getHandler()
        );

        const timeoutMs = customTimeout
            ? (Number(
                  this.reflector.get<string>(
                      REQUEST_CUSTOM_TIMEOUT_VALUE_META_KEY,
                      context.getHandler()
                  )
              ) || 30) * 1000
            : this.maxTimeoutInSecond * 1000;

        return next.handle().pipe(
            timeout(timeoutMs),
            catchError(err => {
                if (err instanceof TimeoutError) {
                    return throwError(
                        () =>
                            new RequestTimeoutException({
                                statusCode:
                                    ENUM_REQUEST_STATUS_CODE_ERROR.TIMEOUT,
                                message: 'http.clientError.requestTimeOut',
                            })
                    );
                }
                return throwError(() => err);
            })
        );
    }
}
