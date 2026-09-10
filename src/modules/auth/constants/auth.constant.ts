import { ENUM_USER_ROLE } from 'src/modules/user/enums/user.enum';

export const AUTH_REDIS_KEYS = {
  otp: (phone: string) => `auth:otp:${phone}`,
  otpDaily: (phone: string) => `auth:otp:daily:${phone}`,
  session: (userId: string, sessionId: string) =>
    `auth:session:${userId}:${sessionId}`,
  sessionsByUser: (userId: string) => `auth:sessions:${userId}`,
  refresh: (sessionId: string) => `auth:refresh:${sessionId}`,
  presence: (userId: string) => `presence:${userId}`,
  socketUser: (socketId: string) => `socket:user:${socketId}`,
  userSockets: (userId: string) => `user:sockets:${userId}`,
} as const;

export const AUTH_OTP_TTL_SECONDS = 300;
export const AUTH_OTP_DAILY_LIMIT = 5;
export const AUTH_OTP_DAILY_TTL_SECONDS = 60 * 60 * 24;
export const AUTH_REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const AUTH_DEV_OTP_CODE = '123456';

export const AUTH_SHOP_ACCESS_ROLES = [
  ENUM_USER_ROLE.USER,
  ENUM_USER_ROLE.OWNER,
  ENUM_USER_ROLE.MANAGER,
  ENUM_USER_ROLE.ADMIN,
] as const;
