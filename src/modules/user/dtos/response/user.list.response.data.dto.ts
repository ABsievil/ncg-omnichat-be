import { ApiProperty } from '@nestjs/swagger';
import { ResponseDataBaseDto } from 'src/common/response/dtos/response.data.base.dto';
import { UserListResponseDto } from 'src/modules/user/dtos/response/user.list.response.dto';

export class UserListResponseDataDto extends ResponseDataBaseDto {
  @ApiProperty({ type: [UserListResponseDto] })
  users!: UserListResponseDto[];
}
