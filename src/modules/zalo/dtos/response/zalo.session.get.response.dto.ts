import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DatabaseDto } from 'src/common/database/dtos/database.dto';
import { ENUM_ZALO_SESSION_STATUS } from 'src/modules/zalo/enums/zalo.enum';

export class ZaloSessionGetResponseDto extends DatabaseDto {
  @ApiProperty()
  accountLabel!: string;

  @ApiProperty({ enum: ENUM_ZALO_SESSION_STATUS })
  status!: ENUM_ZALO_SESSION_STATUS;

  @ApiPropertyOptional()
  ownId?: string | null;

  @ApiPropertyOptional()
  proxy?: string | null;

  @ApiPropertyOptional()
  lastLoginAt?: Date | null;
}
