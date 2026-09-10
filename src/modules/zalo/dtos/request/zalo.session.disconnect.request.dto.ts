import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ZaloSessionDisconnectRequestDto {
  @ApiPropertyOptional({
    description:
      'Shop id of the Zalo session to disconnect. Owners omit this — JWT shop is used.',
  })
  @IsOptional()
  @IsString()
  shopId?: string;
}
