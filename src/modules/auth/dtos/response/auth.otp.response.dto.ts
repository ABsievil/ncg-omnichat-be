import { ApiProperty } from '@nestjs/swagger';

export class AuthOtpResponseDto {
  @ApiProperty({ description: 'OTP TTL in seconds' })
  expiresIn!: number;
}
