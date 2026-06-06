import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
    cached: {
        url: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
    },
}));
