import { Global, Module } from '@nestjs/common';
import { ErrorResponseService } from 'src/common/response/services/error-response.service';

@Global()
@Module({
  providers: [ErrorResponseService],
  exports: [ErrorResponseService],
})
export class ResponseModule {}
