import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  debug: process.env.DATABASE_DEBUG === 'true',
  timeoutOptions: {
    serverSelectionTimeoutMS: parseInt(
      process.env.DATABASE_SERVER_SELECTION_TIMEOUT_MS ?? '5000',
      10,
    ),
  },
}));
