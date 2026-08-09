import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ZaloLoginQrRequestDto {
  @ApiPropertyOptional({
    description:
      'Shop id. Omit to use the default shop, or the authenticated user shopId.',
  })
  @IsOptional()
  @IsString()
  shopId?: string;

  @ApiPropertyOptional({
    description: 'HTTP proxy, e.g. http://user:pass@host:port',
  })
  @IsOptional()
  @IsString()
  proxy?: string;
}
