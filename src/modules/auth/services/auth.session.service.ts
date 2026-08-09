import { Injectable } from '@nestjs/common';
import { v4 as uuidV4 } from 'uuid';
import { HelperHashService } from 'src/common/helper/services/helper.hash.service';
import { RedisService } from 'src/common/redis/services/redis.service';
import {
  AUTH_REDIS_KEYS,
  AUTH_REFRESH_TTL_SECONDS,
} from 'src/modules/auth/constants/auth.constant';
import { IAuthSession } from 'src/modules/auth/interfaces/auth.user.interface';

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly redisService: RedisService,
    private readonly helperHashService: HelperHashService,
  ) {}

  async createSession(params: {
    userId: string;
    refreshToken: string;
    userAgent?: string;
    sessionId?: string;
  }): Promise<IAuthSession> {
    const sessionId = params.sessionId ?? uuidV4();
    const now = new Date().toISOString();
    const session: IAuthSession = {
      sessionId,
      userId: params.userId,
      refreshTokenHash: this.helperHashService.sha256(params.refreshToken),
      createdAt: now,
      lastActiveAt: now,
      userAgent: params.userAgent,
    };

    await this.redisService.set(
      AUTH_REDIS_KEYS.session(params.userId, sessionId),
      session,
      AUTH_REFRESH_TTL_SECONDS,
    );
    await this.redisService.set(
      AUTH_REDIS_KEYS.refresh(sessionId),
      { userId: params.userId, sessionId },
      AUTH_REFRESH_TTL_SECONDS,
    );

    const listKey = AUTH_REDIS_KEYS.sessionsByUser(params.userId);
    const existing = (await this.redisService.get<string[]>(listKey)) ?? [];
    await this.redisService.set(
      listKey,
      Array.from(new Set([...existing, sessionId])),
      AUTH_REFRESH_TTL_SECONDS,
    );

    return session;
  }

  async getSession(
    userId: string,
    sessionId: string,
  ): Promise<IAuthSession | null> {
    return this.redisService.get<IAuthSession>(
      AUTH_REDIS_KEYS.session(userId, sessionId),
    );
  }

  async listSessions(userId: string): Promise<IAuthSession[]> {
    const ids =
      (await this.redisService.get<string[]>(
        AUTH_REDIS_KEYS.sessionsByUser(userId),
      )) ?? [];
    const sessions: IAuthSession[] = [];
    for (const id of ids) {
      const session = await this.getSession(userId, id);
      if (session) {
        sessions.push(session);
      }
    }
    return sessions;
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await this.redisService.del(
      AUTH_REDIS_KEYS.session(userId, sessionId),
      AUTH_REDIS_KEYS.refresh(sessionId),
    );
    const listKey = AUTH_REDIS_KEYS.sessionsByUser(userId);
    const ids = (await this.redisService.get<string[]>(listKey)) ?? [];
    const next = ids.filter(id => id !== sessionId);
    if (next.length) {
      await this.redisService.set(listKey, next, AUTH_REFRESH_TTL_SECONDS);
    } else {
      await this.redisService.del(listKey);
    }
  }

  async rotateRefreshToken(
    userId: string,
    sessionId: string,
    newRefreshToken: string,
  ): Promise<void> {
    const session = await this.getSession(userId, sessionId);
    if (!session) {
      return;
    }
    session.refreshTokenHash = this.helperHashService.sha256(newRefreshToken);
    session.lastActiveAt = new Date().toISOString();
    await this.redisService.set(
      AUTH_REDIS_KEYS.session(userId, sessionId),
      session,
      AUTH_REFRESH_TTL_SECONDS,
    );
    await this.redisService.set(
      AUTH_REDIS_KEYS.refresh(sessionId),
      { userId, sessionId },
      AUTH_REFRESH_TTL_SECONDS,
    );
  }

  async findByRefreshToken(
    refreshToken: string,
  ): Promise<IAuthSession | null> {
    const [sessionId] = refreshToken.split('.');
    if (!sessionId) {
      return null;
    }
    const meta = await this.redisService.get<{
      userId: string;
      sessionId: string;
    }>(AUTH_REDIS_KEYS.refresh(sessionId));
    if (!meta) {
      return null;
    }
    const session = await this.getSession(meta.userId, meta.sessionId);
    if (!session) {
      return null;
    }
    const hash = this.helperHashService.sha256(refreshToken);
    if (session.refreshTokenHash !== hash) {
      return null;
    }
    return session;
  }
}
