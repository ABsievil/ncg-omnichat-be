import { ApiProperty } from '@nestjs/swagger';
import { ResponseDataBaseDto } from 'src/common/response/dtos/response.data.base.dto';

export class ShopDeleteResponseDataDto extends ResponseDataBaseDto {
  @ApiProperty()
  deleted!: boolean;
}
