import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class AuthRequestOtpRequestDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{8,15}$/)
  phone!: string;
}
