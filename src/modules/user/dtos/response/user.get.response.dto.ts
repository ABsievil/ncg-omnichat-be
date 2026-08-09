import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DatabaseDto } from 'src/common/database/dtos/database.dto';
import {
  ENUM_USER_GENDER,
  ENUM_USER_ROLE,
} from 'src/modules/user/enums/user.enum';

export class UserGetResponseDto extends DatabaseDto {
  @ApiProperty()
  phone!: string;

  @ApiPropertyOptional({ nullable: true })
  shopId?: string | null;

  @ApiProperty({ enum: ENUM_USER_ROLE })
  role!: ENUM_USER_ROLE;

  @ApiProperty()
  displayName!: string;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  coverUrl?: string | null;

  @ApiPropertyOptional()
  bio?: string;

  @ApiPropertyOptional({ enum: ENUM_USER_GENDER })
  gender?: ENUM_USER_GENDER;

  @ApiPropertyOptional({ nullable: true })
  dob?: Date | null;

  @ApiPropertyOptional()
  statusText?: string;

  @ApiPropertyOptional({ nullable: true })
  lastActiveAt?: Date | null;
}
