import { IsNotEmpty, IsString } from 'class-validator';

export class AuthRefreshRequestDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
