import { Module } from '@nestjs/common';
import { RequestModule } from 'src/common/request/request.module';

@Module({
  imports: [RequestModule],
  exports: [RequestModule],
})
export class CommonModule {}
