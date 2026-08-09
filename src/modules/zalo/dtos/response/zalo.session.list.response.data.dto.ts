import { ApiProperty } from '@nestjs/swagger';
import { ResponseDataBaseDto } from 'src/common/response/dtos/response.data.base.dto';
import { ZaloSessionListResponseDto } from 'src/modules/zalo/dtos/response/zalo.session.list.response.dto';

export class ZaloSessionListResponseDataDto extends ResponseDataBaseDto {
  @ApiProperty({ type: [ZaloSessionListResponseDto] })
  sessions!: ZaloSessionListResponseDto[];
}
