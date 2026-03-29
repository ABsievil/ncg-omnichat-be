import { Module } from '@nestjs/common';
import { RequestModule } from 'src/common/request/request.module';
import { ResponseModule } from 'src/common/response/response.module';

@Module({
  imports: [RequestModule, ResponseModule],
  exports: [RequestModule, ResponseModule],
})
export class CommonModule {}
