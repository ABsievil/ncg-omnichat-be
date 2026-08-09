import { ApiProperty } from '@nestjs/swagger';
import { ResponseDataBaseDto } from 'src/common/response/dtos/response.data.base.dto';
import { AuthTokenResponseDto } from 'src/modules/auth/dtos/response/auth.token.response.dto';

export class AuthTokenResponseDataDto extends ResponseDataBaseDto {
  @ApiProperty({ type: AuthTokenResponseDto })
  auth!: AuthTokenResponseDto;
}
