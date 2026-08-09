import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ENUM_USER_GENDER } from 'src/modules/user/enums/user.enum';

export class UserUpdateRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  coverUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  bio?: string;

  @IsOptional()
  @IsEnum(ENUM_USER_GENDER)
  gender?: ENUM_USER_GENDER;

  @IsOptional()
  @IsDateString()
  dob?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  statusText?: string;
}
