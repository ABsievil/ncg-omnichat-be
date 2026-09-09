import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ZaloLoginQrRequestDto {
  @ApiPropertyOptional({
    description:
      'Shop id to bind the Zalo QR login. Owners omit this — JWT shop is used. Admin must pass it.',
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
