import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{8,15}$/)
  phone: string;

  @IsString()
  @Length(4, 8)
  otp: string;

  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsOptional()
  @IsString()
  deviceName?: string;
}
