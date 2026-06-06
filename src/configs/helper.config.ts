import { registerAs } from '@nestjs/config';

export default registerAs('helper', () => ({
    jwt: {
        defaultSecretKey:
            process.env.HELPER_JWT_SECRET_KEY ?? 'omnichat-default-secret',
        defaultExpirationTime:
            process.env.HELPER_JWT_EXPIRATION ?? '1h',
    },
}));
