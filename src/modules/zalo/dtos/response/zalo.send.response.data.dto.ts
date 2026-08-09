import { ApiProperty } from '@nestjs/swagger';
import { ResponseDataBaseDto } from 'src/common/response/dtos/response.data.base.dto';
import { ZaloSendResponseDto } from 'src/modules/zalo/dtos/response/zalo.send.response.dto';

export class ZaloSendResponseDataDto extends ResponseDataBaseDto {
  @ApiProperty({ type: ZaloSendResponseDto })
  result!: ZaloSendResponseDto;
}
