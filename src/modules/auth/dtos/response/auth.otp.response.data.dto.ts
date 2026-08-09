import { ApiProperty } from '@nestjs/swagger';
import { ResponseDataBaseDto } from 'src/common/response/dtos/response.data.base.dto';
import { AuthOtpResponseDto } from 'src/modules/auth/dtos/response/auth.otp.response.dto';

export class AuthOtpResponseDataDto extends ResponseDataBaseDto {
  @ApiProperty({ type: AuthOtpResponseDto })
  otp!: AuthOtpResponseDto;
}
