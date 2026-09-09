import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNotIn,
  IsOptional,
  IsPort,
  IsString,
  MinLength,
  ValidateIf,
  validateSync,
} from 'class-validator';

const JWT_FORBIDDEN_DEFAULTS = [
  'omnichat-change-me',
  'omnichat-default-secret',
];

export class AppEnvDto {
  @IsOptional()
  @IsPort()
  PORT?: string;

  @IsOptional()
  @IsString()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV?: string;

  @ValidateIf((env: AppEnvDto) => env.NODE_ENV === 'production')
  @IsString()
  @MinLength(32, {
    message: 'HELPER_JWT_SECRET_KEY must be at least 32 characters',
  })
  @IsNotIn(JWT_FORBIDDEN_DEFAULTS, {
    message: 'HELPER_JWT_SECRET_KEY must not use a default value',
  })
  HELPER_JWT_SECRET_KEY?: string;

  @ValidateIf((env: AppEnvDto) => env.NODE_ENV === 'production')
  @IsString()
  @IsNotEmpty({ message: 'CORS_ORIGIN is required in production' })
  @IsNotIn(['*'], { message: 'CORS_ORIGIN must not be * in production' })
  CORS_ORIGIN?: string;

  @ValidateIf((env: AppEnvDto) => env.NODE_ENV === 'production')
  @IsString()
  @IsNotEmpty({ message: 'DATABASE_URL is required in production' })
  DATABASE_URL?: string;

  @ValidateIf((env: AppEnvDto) => env.NODE_ENV === 'production')
  @IsString()
  @IsNotEmpty({ message: 'REDIS_URL is required in production' })
  REDIS_URL?: string;

  @IsOptional()
  @IsString()
  ENCRYPTION_AES_ENABLE?: string;

  @ValidateIf(
    (env: AppEnvDto) =>
      env.NODE_ENV === 'production' && env.ENCRYPTION_AES_ENABLE === 'true',
  )
  @IsString()
  @MinLength(32, {
    message: 'ENCRYPTION_AES_KEY must be 32 bytes (32 characters)',
  })
  ENCRYPTION_AES_KEY?: string;

  @ValidateIf(
    (env: AppEnvDto) => env.NODE_ENV === 'production' && !!env.AUTH_DEV_OTP_CODE,
  )
  @IsIn([''], {
    message: 'AUTH_DEV_OTP_CODE must not be set in production',
  })
  AUTH_DEV_OTP_CODE?: string;
}

export function validateAppEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const validated = plainToInstance(AppEnvDto, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, {
    skipMissingProperties: false,
    whitelist: false,
    forbidNonWhitelisted: false,
  });

  if (errors.length) {
    const messages = errors
      .flatMap(error => Object.values(error.constraints ?? {}))
      .join('; ');
    throw new Error(`Invalid environment: ${messages}`);
  }

  return config;
}
