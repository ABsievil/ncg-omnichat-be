import { Global, Module } from '@nestjs/common';
import { ResponseInterceptor } from 'src/common/response/interceptors/response.interceptor';
import { ResponseLookupPagingInterceptor } from 'src/common/response/interceptors/response.lookup-paging.interceptor';
import { ResponsePagingInterceptor } from 'src/common/response/interceptors/response.paging.interceptor';

@Global()
@Module({
  providers: [
    ResponseInterceptor,
    ResponsePagingInterceptor,
    ResponseLookupPagingInterceptor,
  ],
  exports: [
    ResponseInterceptor,
    ResponsePagingInterceptor,
    ResponseLookupPagingInterceptor,
  ],
})
export class ResponseModule {}
