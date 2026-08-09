import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ZaloSessionDisconnectRequestDto {
  @ApiProperty({ description: 'Shop id of the Zalo session to disconnect' })
  @IsString()
  @IsNotEmpty()
  shopId!: string;
}
