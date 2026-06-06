import { registerAs } from '@nestjs/config';
import { REDIS_DEFAULTS } from 'src/common/redis/constants/redis.constant';

export default registerAs('redis', () => ({
    cached: {
        url: process.env.REDIS_URL ?? REDIS_DEFAULTS.URL,
        port: parseInt(process.env.REDIS_PORT ?? String(REDIS_DEFAULTS.PORT), 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB ?? String(REDIS_DEFAULTS.DB), 10),
        keyPrefix: process.env.REDIS_KEY_PREFIX ?? REDIS_DEFAULTS.KEY_PREFIX,
    },
}));
