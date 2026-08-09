import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ZaloSessionUpsertRequestDto {
  @ApiPropertyOptional({ default: 'default' })
  @IsOptional()
  @IsString()
  accountLabel?: string;

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
