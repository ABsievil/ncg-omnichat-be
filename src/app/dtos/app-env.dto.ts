import { IsIn, IsOptional, IsPort, IsString } from 'class-validator';

export class AppEnvDto {
  @IsOptional()
  @IsPort()
  PORT?: string;

  @IsOptional()
  @IsString()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV?: string;
}
