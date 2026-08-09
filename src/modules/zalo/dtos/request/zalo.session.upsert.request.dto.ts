import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ZaloSessionUpsertRequestDto {
  @ApiProperty({ description: 'Shop id that owns this Zalo session' })
  @IsString()
  @IsNotEmpty()
  shopId!: string;

  @ApiProperty({
    description: 'Cookie JSON string (array) from Zalo QR login',
  })
  @IsString()
  @IsNotEmpty()
  cookie!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  imei!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userAgent!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proxy?: string;
}
