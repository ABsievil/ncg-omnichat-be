import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ENUM_SHOP_STATUS } from 'src/modules/shop/enums/shop.enum';

export class ShopUpdateRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({ enum: ENUM_SHOP_STATUS })
  @IsOptional()
  @IsEnum(ENUM_SHOP_STATUS)
  status?: ENUM_SHOP_STATUS;
}
