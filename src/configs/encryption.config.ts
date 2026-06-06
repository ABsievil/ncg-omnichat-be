import { registerAs } from '@nestjs/config';

export default registerAs('encryption', () => ({
    aes: {
        enable: process.env.ENCRYPTION_AES_ENABLE === 'true',
        keyClient: process.env.ENCRYPTION_AES_KEY_CLIENT ?? '',
        key: process.env.ENCRYPTION_AES_KEY ?? '',
        iv: process.env.ENCRYPTION_AES_IV ?? '',
    },
}));
