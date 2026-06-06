export const REDIS_CONFIG_PATH = {
    ROOT: 'redis',
    CACHED: {
        URL: 'redis.cached.url',
        PORT: 'redis.cached.port',
        PASSWORD: 'redis.cached.password',
        DB: 'redis.cached.db',
        KEY_PREFIX: 'redis.cached.keyPrefix',
    },
} as const;

export const REDIS_DEFAULTS = {
    URL: 'redis://127.0.0.1:6379',
    PORT: 6379,
    DB: 0,
    KEY_PREFIX: 'omnichat:',
} as const;

export const REDIS_KEY_SUFFIX = {
    ENTITY: 'entity:',
} as const;
