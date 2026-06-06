import { registerAs } from '@nestjs/config';

export default registerAs('debug', () => ({
    enable: process.env.DEBUG_ENABLE === 'true',
}));
