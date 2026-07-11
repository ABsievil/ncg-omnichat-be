export const AUTH_REDIS_KEYS = {
  otp: (phone: string) => `auth:otp:${phone}`,
  session: (userId: string, sessionId: string) =>
    `auth:session:${userId}:${sessionId}`,
  sessionsByUser: (userId: string) => `auth:sessions:${userId}`,
  refresh: (sessionId: string) => `auth:refresh:${sessionId}`,
  presence: (userId: string) => `presence:${userId}`,
  socketUser: (socketId: string) => `socket:user:${socketId}`,
  userSockets: (userId: string) => `user:sockets:${userId}`,
} as const;

export const AUTH_OTP_TTL_SECONDS = 300;
export const AUTH_REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const AUTH_DEV_OTP_CODE = '123456';
