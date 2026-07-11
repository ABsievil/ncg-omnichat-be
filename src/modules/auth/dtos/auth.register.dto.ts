import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{8,15}$/)
  phone: string;

  @IsString()
  @Length(4, 8)
  otp: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 80)
  displayName: string;

  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsOptional()
  @IsString()
  deviceName?: string;
}
