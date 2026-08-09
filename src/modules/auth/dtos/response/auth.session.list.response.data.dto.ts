import { ApiProperty } from '@nestjs/swagger';
import { ResponseDataBaseDto } from 'src/common/response/dtos/response.data.base.dto';
import { AuthSessionListResponseDto } from 'src/modules/auth/dtos/response/auth.session.list.response.dto';

export class AuthSessionListResponseDataDto extends ResponseDataBaseDto {
  @ApiProperty({ type: [AuthSessionListResponseDto] })
  sessions!: AuthSessionListResponseDto[];
}
