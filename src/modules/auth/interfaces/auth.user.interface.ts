export interface IAuthUser {
  userId: string;
  sessionId: string;
  phone: string;
}

export interface IAuthTokenPayload {
  sub: string;
  sid: string;
  phone: string;
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
