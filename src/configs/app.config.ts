import { registerAs } from '@nestjs/config';
import { DEFAULT_UTC } from 'src/app/constants/app.constant';

export default registerAs('app', () => ({
  name: process.env.APP_NAME,
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT as string, 10),
  apiPrefix: process.env.API_PREFIX,
  apiVersion: process.env.API_VERSION,
  release: process.env.APP_RELEASE ?? '0.0.1',
  timezone: process.env.APP_TIMEZONE ?? `UTC+${DEFAULT_UTC}`,
  clientAppKey: process.env.APP_CLIENT_APP_KEY ?? '',
}));
