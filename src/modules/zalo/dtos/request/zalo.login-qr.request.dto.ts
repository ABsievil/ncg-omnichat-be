import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ZaloLoginQrRequestDto {
  @ApiPropertyOptional({ default: 'default' })
  @IsOptional()
  @IsString()
  accountLabel?: string;

  @ApiPropertyOptional({
    description: 'HTTP proxy, e.g. http://user:pass@host:port',
  })
  @IsOptional()
  @IsString()
  proxy?: string;
}
