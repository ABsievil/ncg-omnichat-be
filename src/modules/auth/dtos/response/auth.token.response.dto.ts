import { ApiProperty } from '@nestjs/swagger';
import { UserGetResponseDto } from 'src/modules/user/dtos/response/user.get.response.dto';

export class AuthTokenResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty()
  expiresIn!: string | number;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty()
  sessionId!: string;

  @ApiProperty({ type: UserGetResponseDto })
  user!: UserGetResponseDto;
}
