import { registerAs } from '@nestjs/config';

export default registerAs('helper', () => ({
    jwt: {
        defaultSecretKey:
            process.env.HELPER_JWT_SECRET_KEY ??
            (process.env.NODE_ENV === 'production'
                ? undefined
                : 'omnichat-default-secret'),
        defaultExpirationTime:
            process.env.HELPER_JWT_EXPIRATION ?? '1h',
    },
}));
