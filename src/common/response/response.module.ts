import { Global, Module } from '@nestjs/common';
import { ResponseInterceptor } from 'src/common/response/interceptors/response.interceptor';
import { ResponseLookupPagingInterceptor } from 'src/common/response/interceptors/response.lookup-paging.interceptor';
import { ResponsePagingInterceptor } from 'src/common/response/interceptors/response.paging.interceptor';
import { ErrorResponseService } from 'src/common/response/services/error-response.service';

@Global()
@Module({
  providers: [
    ResponseInterceptor,
    ResponsePagingInterceptor,
    ResponseLookupPagingInterceptor,
    ErrorResponseService,
  ],
  exports: [
    ResponseInterceptor,
    ResponsePagingInterceptor,
    ResponseLookupPagingInterceptor,
    ErrorResponseService,
  ],
})
export class ResponseModule {}
