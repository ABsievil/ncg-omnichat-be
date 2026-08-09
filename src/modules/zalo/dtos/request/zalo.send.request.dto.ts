import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ENUM_ZALO_THREAD_TYPE } from 'src/modules/zalo/enums/zalo.enum';

export class ZaloSendRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  threadId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({
    enum: ENUM_ZALO_THREAD_TYPE,
    default: ENUM_ZALO_THREAD_TYPE.USER,
  })
  @IsOptional()
  @IsEnum(ENUM_ZALO_THREAD_TYPE)
  type?: ENUM_ZALO_THREAD_TYPE;
}
