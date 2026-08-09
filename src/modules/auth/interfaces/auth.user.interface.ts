import { ENUM_USER_ROLE } from 'src/modules/user/enums/user.enum';

export interface IAuthUser {
  userId: string;
  sessionId: string;
  phone: string;
  shopId: string | null;
  role: ENUM_USER_ROLE;
}

export interface IAuthTokenPayload {
  sub: string;
  sid: string;
  phone: string;
  shopId: string | null;
  role: ENUM_USER_ROLE;
  typ: 'access' | 'refresh';
}

export interface IAuthSession {
  sessionId: string;
  userId: string;
  refreshTokenHash: string;
  createdAt: string;
  lastActiveAt: string;
  userAgent?: string;
}
