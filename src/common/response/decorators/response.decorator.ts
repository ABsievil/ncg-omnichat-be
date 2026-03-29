import { SetMetadata, UseInterceptors, applyDecorators } from '@nestjs/common';
import { RESPONSE_MESSAGE_PATH_META_KEY } from 'src/common/response/constants/response.constant';
import { ResponseLookupPagingInterceptor } from 'src/common/response/interceptors/response.lookup-paging.interceptor';
import { ResponsePagingInterceptor } from 'src/common/response/interceptors/response.paging.interceptor';
import { ResponseInterceptor } from 'src/common/response/interceptors/response.interceptor';

export const Response = (messagePath: string): MethodDecorator =>
  applyDecorators(
    SetMetadata(RESPONSE_MESSAGE_PATH_META_KEY, messagePath),
    UseInterceptors(ResponseInterceptor),
  );

export const ResponsePaging = (messagePath: string): MethodDecorator =>
  applyDecorators(
    SetMetadata(RESPONSE_MESSAGE_PATH_META_KEY, messagePath),
    UseInterceptors(ResponsePagingInterceptor),
  );

export const ResponseLookupPaging = (messagePath: string): MethodDecorator =>
  applyDecorators(
    SetMetadata(RESPONSE_MESSAGE_PATH_META_KEY, messagePath),
    UseInterceptors(ResponseLookupPagingInterceptor),
  );
