import { registerAs } from '@nestjs/config';

export default registerAs('zalo', () => ({
  proxy: process.env.ZALO_PROXY ?? '',
  reconnectDelayMs: parseInt(process.env.ZALO_RECONNECT_DELAY_MS ?? '15000', 10),
  maxReconnectAttempts: parseInt(
    process.env.ZALO_MAX_RECONNECT_ATTEMPTS ?? '5',
    10,
  ),
}));
