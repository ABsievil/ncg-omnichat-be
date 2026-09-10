import 'reflect-metadata';
import { validateAppEnv } from 'src/app/dtos/app-env.dto';

describe('validateAppEnv', () => {
  const base = {
    NODE_ENV: 'development',
    PORT: '8090',
  };

  it('allows development defaults', () => {
    expect(() => validateAppEnv(base)).not.toThrow();
  });

  it('fails production without jwt secret', () => {
    expect(() =>
      validateAppEnv({
        NODE_ENV: 'production',
        CORS_ORIGIN: 'https://omnichat.ncgstudio.tech',
        DATABASE_URL: 'mongodb://127.0.0.1:27017/omnichat',
        REDIS_URL: 'redis://127.0.0.1:6379',
      }),
    ).toThrow(/HELPER_JWT_SECRET_KEY/);
  });

  it('fails production with wildcard CORS', () => {
    expect(() =>
      validateAppEnv({
        NODE_ENV: 'production',
        HELPER_JWT_SECRET_KEY: 'a'.repeat(32),
        CORS_ORIGIN: '*',
        DATABASE_URL: 'mongodb://127.0.0.1:27017/omnichat',
        REDIS_URL: 'redis://127.0.0.1:6379',
      }),
    ).toThrow(/CORS_ORIGIN/);
  });

  it('fails production when AUTH_DEV_OTP_CODE is set', () => {
    expect(() =>
      validateAppEnv({
        NODE_ENV: 'production',
        HELPER_JWT_SECRET_KEY: 'a'.repeat(32),
        CORS_ORIGIN: 'https://omnichat.ncgstudio.tech',
        DATABASE_URL: 'mongodb://127.0.0.1:27017/omnichat',
        REDIS_URL: 'redis://127.0.0.1:6379',
        AUTH_DEV_OTP_CODE: '123456',
      }),
    ).toThrow(/AUTH_DEV_OTP_CODE/);
  });

  it('accepts a valid production env', () => {
    expect(() =>
      validateAppEnv({
        NODE_ENV: 'production',
        HELPER_JWT_SECRET_KEY: 'a'.repeat(32),
        CORS_ORIGIN: 'https://omnichat.ncgstudio.tech',
        DATABASE_URL: 'mongodb://127.0.0.1:27017/omnichat',
        REDIS_URL: 'redis://127.0.0.1:6379',
      }),
    ).not.toThrow();
  });
});
