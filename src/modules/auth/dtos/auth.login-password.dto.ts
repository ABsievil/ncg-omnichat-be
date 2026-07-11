import { IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class LoginPasswordDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{8,15}$/)
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsOptional()
  @IsString()
  deviceName?: string;
}
