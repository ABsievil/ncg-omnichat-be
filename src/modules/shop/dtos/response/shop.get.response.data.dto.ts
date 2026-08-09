import { ApiProperty } from '@nestjs/swagger';
import { ResponseDataBaseDto } from 'src/common/response/dtos/response.data.base.dto';
import { ShopGetResponseDto } from 'src/modules/shop/dtos/response/shop.get.response.dto';

export class ShopGetResponseDataDto extends ResponseDataBaseDto {
  @ApiProperty({ type: ShopGetResponseDto })
  shop!: ShopGetResponseDto;
}
