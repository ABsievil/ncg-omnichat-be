import { ApiProperty } from '@nestjs/swagger';
import { ResponseDataBaseDto } from 'src/common/response/dtos/response.data.base.dto';
import { ZaloSessionGetResponseDto } from 'src/modules/zalo/dtos/response/zalo.session.get.response.dto';

export class ZaloSessionListResponseDataDto extends ResponseDataBaseDto {
  @ApiProperty({ type: [ZaloSessionGetResponseDto] })
  sessions!: ZaloSessionGetResponseDto[];
}
