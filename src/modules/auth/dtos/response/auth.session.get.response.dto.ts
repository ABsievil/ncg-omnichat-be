import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthSessionGetResponseDto {
  @ApiProperty()
  sessionId!: string;

  @ApiProperty()
  createdAt!: Date | string;

  @ApiPropertyOptional()
  lastActiveAt?: Date | string;
}
