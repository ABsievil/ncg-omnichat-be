import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_PATH_META_KEY } from 'src/common/response/constants/response.constant';
import type { IResponseLookupPaging } from 'src/common/response/interfaces/response.interface';

@Injectable()
export class ResponseLookupPagingInterceptor<T>
  implements NestInterceptor<IResponseLookupPaging<T>, Record<string, unknown>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<IResponseLookupPaging<T>>,
  ): Observable<Record<string, unknown>> {
    return next.handle().pipe(
      map((controllerResult) => {
        const messagePath = this.reflector.getAllAndOverride<string>(
          RESPONSE_MESSAGE_PATH_META_KEY,
          [context.getHandler(), context.getClass()],
        );

        const request = context
          .switchToHttp()
          .getRequest<Record<string, unknown>>();

        const { data, _pagination, _metadata: controllerMeta } =
          controllerResult ?? {};
        const { customProperty, ...baseMeta } = controllerMeta ?? {};

        if (data === null || data === undefined) {
          throw new Error(
            'ResponseLookupPagingInterceptor: data must not be null or undefined',
          );
        }

        const paginationFromPipe = request['__pagination'] as
          | Record<string, unknown>
          | undefined;

        return {
          statusCode: customProperty?.statusCode ?? 200,
          message: customProperty?.message ?? messagePath ?? '',
          _metadata: {
            language: (request['__language'] as string) ?? 'en',
            timestamp: new Date().toISOString(),
            timezone: 'UTC',
            path: (request['url'] as string) ?? '',
            version: (request['__version'] as string) ?? '1',
            ...baseMeta,
            pagination: { ...paginationFromPipe, ..._pagination },
          },
          data,
        };
      }),
    );
  }
}
