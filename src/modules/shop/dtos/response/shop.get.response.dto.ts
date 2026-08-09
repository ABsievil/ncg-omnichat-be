import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DatabaseDto } from 'src/common/database/dtos/database.dto';
import { ENUM_SHOP_STATUS } from 'src/modules/shop/enums/shop.enum';

export class ShopGetResponseDto extends DatabaseDto {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty({ enum: ENUM_SHOP_STATUS })
  status!: ENUM_SHOP_STATUS;

  @ApiPropertyOptional()
  chatbotKey?: string | null;
}
