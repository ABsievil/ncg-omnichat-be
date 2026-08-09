import { ApiPropertyOptional } from '@nestjs/swagger';
import { ResponseDataBaseDto } from 'src/common/response/dtos/response.data.base.dto';
import { ZaloSessionGetResponseDto } from 'src/modules/zalo/dtos/response/zalo.session.get.response.dto';

export class ZaloSessionGetResponseDataDto extends ResponseDataBaseDto {
  @ApiPropertyOptional({ type: ZaloSessionGetResponseDto, nullable: true })
  session!: ZaloSessionGetResponseDto | null;
}
