import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class AuthLoginPasswordRequestDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{8,15}$/)
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
