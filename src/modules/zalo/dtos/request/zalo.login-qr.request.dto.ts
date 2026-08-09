import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ZaloLoginQrRequestDto {
  @ApiProperty({ description: 'Shop id to bind the Zalo QR login session' })
  @IsString()
  @IsNotEmpty()
  shopId!: string;

  @ApiPropertyOptional({
    description: 'HTTP proxy, e.g. http://user:pass@host:port',
  })
  @IsOptional()
  @IsString()
  proxy?: string;
}
