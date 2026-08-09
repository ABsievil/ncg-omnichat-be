import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class AuthVerifyOtpRequestDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{8,15}$/)
  phone!: string;

  @IsString()
  @Length(4, 8)
  otp!: string;
}
