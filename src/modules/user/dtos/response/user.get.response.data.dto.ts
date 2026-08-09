import { ApiProperty } from '@nestjs/swagger';
import { ResponseDataBaseDto } from 'src/common/response/dtos/response.data.base.dto';
import { UserGetResponseDto } from 'src/modules/user/dtos/response/user.get.response.dto';

export class UserGetResponseDataDto extends ResponseDataBaseDto {
  @ApiProperty({ type: UserGetResponseDto })
  user!: UserGetResponseDto;
}
