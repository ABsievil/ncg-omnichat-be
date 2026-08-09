import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ZaloSendResponseDto {
  @ApiProperty()
  success!: boolean;

  @ApiPropertyOptional()
  response?: unknown;
}
