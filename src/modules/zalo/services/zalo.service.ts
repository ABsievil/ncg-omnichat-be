import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThreadType, Zalo, type API } from 'zca-js';
import { HelperEncryptionService } from 'src/common/helper/services/helper.encryption.service';
import { RedisService } from 'src/common/redis/services/redis.service';
import { ShopService } from 'src/modules/shop/services/shop.service';
import { ShopError } from 'src/modules/shop/errors/shop.error';
import {
  ZALO_LOGIN_MAX_RETRIES,
  ZALO_LOGIN_RETRY_DELAY_MS,
  ZALO_REDIS_CHANNEL_SESSION_DISABLED,
  ZALO_REDIS_CHANNEL_SESSION_RENEWED,
} from 'src/modules/zalo/constants/zalo.constant';
import {
  ZaloSessionDoc,
  ZaloSessionEntity,
} from 'src/modules/zalo/entities/zalo-session.entity';
import {
  ENUM_ZALO_SESSION_STATUS,
  ENUM_ZALO_THREAD_TYPE,
} from 'src/modules/zalo/enums/zalo.enum';
import { ZaloSessionError } from 'src/modules/zalo/errors/zalo.session.error';
import {
  IZaloMessage,
  IZaloQrEvent,
  IZaloResolveSenderNameInput,
  IZaloSendMessageInput,
  IZaloSessionCredentials,
} from 'src/modules/zalo/interfaces/zalo.interface';
import { mapIncomingZaloMessage } from 'src/modules/zalo/mappers/zalo-message.mapper';
import { ZaloSessionUpsertRequestDto } from 'src/modules/zalo/dtos/request/zalo.session.upsert.request.dto';
import { ZaloSessionGetResponseDto } from 'src/modules/zalo/dtos/response/zalo.session.get.response.dto';
import { ZaloSessionRepository } from 'src/modules/zalo/repositories/zalo-session.repository';

@Injectable()
export class ZaloService implements OnModuleDestroy {
  private readonly logger = new Logger(ZaloService.name);
  /** key = shopId (1 Zalo account / shop) */
  private readonly apis = new Map<string, API>();
  /** key = shopId:userId */
  private readonly senderNameCache = new Map<string, string>();

  constructor(
    private readonly zaloSessionRepository: ZaloSessionRepository,
    private readonly configService: ConfigService,
    private readonly helperEncryptionService: HelperEncryptionService,
    private readonly zaloSessionError: ZaloSessionError,
    private readonly redisService: RedisService,
    private readonly shopService: ShopService,
    private readonly shopError: ShopError,
  ) {}

  onModuleDestroy(): void {
    this.clearAllApis();
  }

  isConnected(shopId?: string): boolean {
    if (!shopId) {
      return this.apis.size > 0;
    }
    return this.apis.has(shopId);
  }

  getApi(shopId: string): API | undefined {
    return this.apis.get(shopId);
  }

  listConnectedShopIds(): string[] {
    return [...this.apis.keys()];
  }

  clearApi(shopId: string): void {
    const api = this.apis.get(shopId);
    if (!api) {
      return;
    }
    try {
      api.listener.stop();
    } catch (error) {
      this.logger.warn(
        `Failed to stop Zalo listener shopId=${shopId}: ${String(error)}`,
      );
    }
    this.apis.delete(shopId);
  }

  clearAllApis(): void {
    for (const shopId of [...this.apis.keys()]) {
      this.clearApi(shopId);
    }
  }

  async resolveShopId(shopId?: string): Promise<string> {
    const resolved = shopId?.trim();
    if (!resolved) {
      this.shopError.throwShopIdRequired();
    }
    await this.shopService.assertActiveShop(resolved);
    return resolved;
  }

  async upsertSession(
    dto: ZaloSessionUpsertRequestDto,
  ): Promise<ZaloSessionGetResponseDto> {
    const shopId = await this.resolveShopId(dto.shopId);
    const { cookieEncrypted, cookieIv } = this.encryptSecret(dto.cookie);
    const proxy =
      dto.proxy?.trim() ||
      this.configService.get<string>('zalo.proxy') ||
      null;

    const session = await this.zaloSessionRepository.upsert(
      { shopId },
      {
        $set: {
          shopId,
          cookieEncrypted,
          cookieIv,
          imei: dto.imei,
          userAgent: dto.userAgent,
          proxy,
          status: ENUM_ZALO_SESSION_STATUS.ACTIVE,
          lastLoginAt: new Date(),
          deleted: false,
        },
        $unset: { accountLabel: 1 },
      },
      undefined,
      { upsert: true },
    );

    return this.mapGet(session);
  }

  async getSession(shopId: string): Promise<ZaloSessionGetResponseDto | null> {
    const resolvedShopId = await this.resolveShopId(shopId);
    const session = await this.zaloSessionRepository.findOne({
      shopId: resolvedShopId,
    });
    return session ? this.mapGet(session) : null;
  }

  async listSessions(shopId?: string): Promise<ZaloSessionGetResponseDto[]> {
    const filter: Record<string, unknown> = {};
    if (shopId?.trim()) {
      filter.shopId = await this.resolveShopId(shopId);
    }
    const sessions = await this.zaloSessionRepository.findAll(filter, {
      order: { updatedAt: -1 },
    });
    return sessions.map(session => this.mapGet(session));
  }

  async listActiveShopIds(): Promise<string[]> {
    const sessions = await this.zaloSessionRepository.findAll(
      {
        status: ENUM_ZALO_SESSION_STATUS.ACTIVE,
      },
      { select: { shopId: 1 } },
    );

    return [
      ...new Set(
        sessions
          .map(session => String(session.shopId ?? '').trim())
          .filter(Boolean),
      ),
    ];
  }

  /** Worker-safe lookup: no shop assert / no default fallback. */
  async findSessionByShopId(
    shopId: string,
  ): Promise<ZaloSessionGetResponseDto | null> {
    const resolved = shopId?.trim();
    if (!resolved) {
      return null;
    }
    const session = await this.zaloSessionRepository.findOne({
      shopId: resolved,
    });
    return session ? this.mapGet(session) : null;
  }

  async markSessionStatus(
    status: ENUM_ZALO_SESSION_STATUS,
    shopId: string,
  ): Promise<void> {
    await this.zaloSessionRepository.updateMany({ shopId }, { status });
  }

  /**
   * Disable Zalo session so the worker stops auto-replying.
   * Credentials are kept; reconnect via QR to re-enable.
   */
  async disconnectSession(
    shopId: string,
  ): Promise<ZaloSessionGetResponseDto> {
    const resolvedShopId = await this.resolveShopId(shopId);
    const session = await this.zaloSessionRepository.findOne({
      shopId: resolvedShopId,
    });

    if (!session) {
      this.zaloSessionError.throwSessionNotFound();
    }

    if (session.status !== ENUM_ZALO_SESSION_STATUS.DISABLED) {
      await this.zaloSessionRepository.updateMany(
        { shopId: resolvedShopId },
        { status: ENUM_ZALO_SESSION_STATUS.DISABLED },
      );
    }

    this.clearApi(resolvedShopId);
    await this.notifySessionDisabled(resolvedShopId);

    const updated = await this.getSession(resolvedShopId);
    return updated!;
  }

  async notifySessionDisabled(shopId: string): Promise<void> {
    try {
      await this.redisService.publish(ZALO_REDIS_CHANNEL_SESSION_DISABLED, {
        shopId,
        at: new Date().toISOString(),
      });
      this.logger.log(`Published session disabled shopId=${shopId}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish session disabled: ${String(error)}`,
      );
    }
  }

  async loadCredentials(shopId: string): Promise<IZaloSessionCredentials> {
    const session = await this.zaloSessionRepository.findOne(
      { shopId },
      { select: '+cookieEncrypted +cookieIv +imei +userAgent' },
    );

    ZaloSessionError.assertActive(session);

    return {
      cookie: this.decryptSecret(session.cookieEncrypted, session.cookieIv),
      imei: session.imei,
      userAgent: session.userAgent,
      proxy:
        session.proxy ??
        this.configService.get<string>('zalo.proxy') ??
        undefined,
    };
  }

  async loginWithSession(
    shopId: string,
    opts?: { selfListen?: boolean },
  ): Promise<API> {
    const credentials = await this.loadCredentials(shopId);
    const api = await this.loginWithRetry(credentials, {
      selfListen: opts?.selfListen ?? false,
    });
    this.apis.set(shopId, api);

    try {
      const ownId =
        typeof api.getOwnId === 'function' ? String(api.getOwnId()) : null;
      // Never resurrect a DISABLED session if disconnect raced with login.
      await this.zaloSessionRepository.updateMany(
        {
          shopId,
          status: { $ne: ENUM_ZALO_SESSION_STATUS.DISABLED },
        },
        {
          status: ENUM_ZALO_SESSION_STATUS.ACTIVE,
          lastLoginAt: new Date(),
          ...(ownId ? { ownId } : {}),
        },
      );
    } catch (error) {
      this.logger.warn(`Failed to refresh session metadata: ${String(error)}`);
    }

    return api;
  }

  async loginQr(
    onEvent: (event: IZaloQrEvent) => void,
    options: { shopId: string; proxy?: string },
  ): Promise<{
    api: API;
    credentials: IZaloSessionCredentials;
    shopId: string;
  }> {
    const shopId = await this.resolveShopId(options.shopId);
    const proxy =
      options.proxy?.trim() ||
      this.configService.get<string>('zalo.proxy') ||
      undefined;

    await this.zaloSessionRepository.upsert(
      { shopId },
      {
        $set: {
          shopId,
          status: ENUM_ZALO_SESSION_STATUS.PENDING_QR,
          deleted: false,
        },
        $setOnInsert: {
          cookieEncrypted: '[]',
          imei: '',
          userAgent: '',
        },
        $unset: { accountLabel: 1 },
      },
      undefined,
      { upsert: true },
    );

    const zalo = new Zalo({
      selfListen: true,
      logging: true,
      ...(proxy ? { proxy } : {}),
    });

    let earlyCredentials: IZaloSessionCredentials | undefined;

    const api = await zalo.loginQR(undefined, (qrEvent: IZaloQrEvent) => {
      onEvent(qrEvent);

      if (
        qrEvent?.type === 4 &&
        qrEvent.data &&
        Array.isArray(qrEvent.data.cookie) &&
        qrEvent.data.cookie.length > 0
      ) {
        const nextCredentials: IZaloSessionCredentials = {
          cookie: JSON.stringify(qrEvent.data.cookie),
          imei: qrEvent.data.imei || '',
          userAgent: qrEvent.data.userAgent || '',
          proxy,
        };
        earlyCredentials = nextCredentials;
        void this.upsertSession({
          shopId,
          cookie: nextCredentials.cookie,
          imei: nextCredentials.imei,
          userAgent: nextCredentials.userAgent,
          proxy,
        }).catch(error => {
          this.logger.error(`Early credential save failed: ${String(error)}`);
        });
      }
    });

    const ctx =
      typeof api.getContext === 'function'
        ? (api.getContext() as Record<string, unknown>)
        : ((api as { context?: Record<string, unknown> }).context ?? null);

    const early = earlyCredentials;
    const cookieJson = this.serializeCookie(ctx?.cookie) ?? early?.cookie;
    const imei = String(ctx?.imei ?? early?.imei ?? '');
    const userAgent = String(ctx?.userAgent ?? early?.userAgent ?? '');

    if (!cookieJson || !imei || !userAgent) {
      this.zaloSessionError.throwLoginFailed(
        'QR login completed but credentials are incomplete',
      );
    }

    const credentials: IZaloSessionCredentials = {
      cookie: cookieJson,
      imei,
      userAgent,
      proxy,
    };

    await this.upsertSession({
      shopId,
      cookie: credentials.cookie,
      imei: credentials.imei,
      userAgent: credentials.userAgent,
      proxy,
    });

    const ownId =
      typeof api.getOwnId === 'function' ? String(api.getOwnId()) : null;
    if (ownId) {
      await this.zaloSessionRepository.updateMany({ shopId }, { ownId });
    } else {
      await this.zaloSessionRepository.updateManyRaw(
        { shopId },
        { $unset: { ownId: 1 } },
      );
    }

    await this.notifySessionRenewed(shopId);

    // API must not keep a live Zalo socket — worker owns the single listener.
    // Holding both kicks the other (zca-js / Zalo allow one connection per account).
    this.releaseLiveConnection(api, shopId);

    return { api, credentials, shopId };
  }

  /** Stop websocket and drop in-memory API for a shop. */
  private releaseLiveConnection(api: API, shopId: string): void {
    try {
      api.listener?.stop?.();
    } catch (error) {
      this.logger.warn(
        `Failed to stop Zalo socket after QR [shop=${shopId}]: ${String(error)}`,
      );
    }
    this.apis.delete(shopId);
  }

  async notifySessionRenewed(shopId: string): Promise<void> {
    try {
      await this.redisService.publish(ZALO_REDIS_CHANNEL_SESSION_RENEWED, {
        shopId,
        at: new Date().toISOString(),
      });
      this.logger.log(`Published session renew shopId=${shopId}`);
    } catch (error) {
      this.logger.error(`Failed to publish session renew: ${String(error)}`);
    }
  }

  async sendMessage(input: IZaloSendMessageInput): Promise<unknown> {
    const shopId = await this.resolveShopId(input.shopId);
    const api = await this.ensureApi(shopId);
    const type =
      input.type === ENUM_ZALO_THREAD_TYPE.GROUP
        ? ThreadType.Group
        : ThreadType.User;

    try {
      await api.sendTypingEvent(input.threadId, type);
    } catch {
      this.logger.debug('sendTypingEvent failed (ignored)');
    }

    const payload: {
      msg: string;
      quote?: IZaloSendMessageInput['quote'];
      mentions?: IZaloSendMessageInput['mentions'];
    } = {
      msg: input.message,
    };
    if (input.quote) {
      payload.quote = input.quote;
    }
    if (input.mentions?.length && type === ThreadType.Group) {
      payload.mentions = input.mentions;
    }

    try {
      return await api.sendMessage(payload, input.threadId, type);
    } catch (error) {
      if (payload.quote) {
        this.logger.warn(
          `Send with quote failed, retry without quote: ${String(error)}`,
        );
        try {
          const fallback = {
            msg: payload.msg,
            ...(payload.mentions ? { mentions: payload.mentions } : {}),
          };
          return await api.sendMessage(fallback, input.threadId, type);
        } catch (fallbackError) {
          const reason =
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError);
          this.zaloSessionError.throwSendFailed(reason);
        }
      }

      const reason = error instanceof Error ? error.message : String(error);
      this.zaloSessionError.throwSendFailed(reason);
    }
  }

  normalizeIncomingMessage(message: unknown): IZaloMessage | null {
    return mapIncomingZaloMessage(message);
  }

  async resolveSenderName(
    input: IZaloResolveSenderNameInput,
  ): Promise<string | undefined> {
    const fromMessage = input.userName?.trim();
    if (fromMessage) {
      this.senderNameCache.set(`${input.shopId}:${input.userId}`, fromMessage);
      return fromMessage;
    }

    if (input.type !== ENUM_ZALO_THREAD_TYPE.GROUP) {
      return undefined;
    }

    const cacheKey = `${input.shopId}:${input.userId}`;
    const cached = this.senderNameCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const api = this.apis.get(input.shopId);
    if (!api?.getGroupMembersInfo) {
      return undefined;
    }

    try {
      const result = await api.getGroupMembersInfo(input.userId);
      const profile = result?.profiles?.[input.userId];
      const name =
        profile?.displayName?.trim() || profile?.zaloName?.trim() || undefined;
      if (name) {
        this.senderNameCache.set(cacheKey, name);
      }
      return name;
    } catch (error) {
      this.logger.debug(
        `resolveSenderName failed shop=${input.shopId} user=${input.userId}: ${String(error)}`,
      );
      return undefined;
    }
  }

  mapGet(session: ZaloSessionDoc | ZaloSessionEntity): ZaloSessionGetResponseDto {
    const doc = session as ZaloSessionDoc;
    return {
      _id: String(doc._id),
      createdAt: doc.createdAt as Date,
      updatedAt: doc.updatedAt as Date,
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy,
      deleted: !!doc.deleted,
      deletedAt: doc.deletedAt,
      deletedBy: doc.deletedBy,
      shopId: doc.shopId,
      status: doc.status,
      ownId: doc.ownId ?? null,
      proxy: doc.proxy ?? null,
      lastLoginAt: doc.lastLoginAt ?? null,
    };
  }

  mapGetData(session: ZaloSessionGetResponseDto | null) {
    return {
      session,
      createdBy: [] as [],
      updatedBy: [] as [],
    };
  }

  mapListData(sessions: ZaloSessionGetResponseDto[]) {
    return {
      sessions,
      createdBy: [] as [],
      updatedBy: [] as [],
    };
  }

  private async ensureApi(shopId: string): Promise<API> {
    const existing = this.apis.get(shopId);
    if (existing) {
      return existing;
    }
    return this.loginWithSession(shopId);
  }

  private async loginWithRetry(
    credentials: IZaloSessionCredentials,
    opts: { selfListen: boolean },
  ): Promise<API> {
    let lastError: Error | undefined;
    const cookie = JSON.parse(credentials.cookie);

    for (let attempt = 1; attempt <= ZALO_LOGIN_MAX_RETRIES; attempt++) {
      try {
        const zalo = new Zalo({
          selfListen: opts.selfListen,
          logging: false,
          ...(credentials.proxy ? { proxy: credentials.proxy } : {}),
        });
        const api = await zalo.login({
          cookie,
          imei: credentials.imei,
          userAgent: credentials.userAgent,
        });
        if (!api) {
          throw new Error('Zalo login returned empty API instance');
        }
        return api;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < ZALO_LOGIN_MAX_RETRIES) {
          const delay = ZALO_LOGIN_RETRY_DELAY_MS * attempt;
          this.logger.warn(
            `Zalo login attempt ${attempt}/${ZALO_LOGIN_MAX_RETRIES} failed: ${lastError.message}. Retry in ${delay}ms`,
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    this.zaloSessionError.throwLoginFailed(
      lastError?.message ?? 'Unknown login error',
    );
  }

  private encryptSecret(value: string): {
    cookieEncrypted: string;
    cookieIv: string | null;
  } {
    const key = this.configService.get<string>('encryption.aes.key') ?? '';
    const enabled =
      this.configService.get<boolean>('encryption.aes.enable') ?? false;

    if (!enabled || !key) {
      return { cookieEncrypted: value, cookieIv: null };
    }

    const result = this.helperEncryptionService.aes256EncryptWithIv(
      { value },
      key,
    );
    return {
      cookieEncrypted: result.encryptedData,
      cookieIv: result.iv,
    };
  }

  private decryptSecret(encrypted: string, iv?: string | null): string {
    const key = this.configService.get<string>('encryption.aes.key') ?? '';
    const enabled =
      this.configService.get<boolean>('encryption.aes.enable') ?? false;

    if (!enabled || !key || !iv) {
      return encrypted;
    }

    const decrypted = this.helperEncryptionService.aes256DecryptWithIv<{
      value: string;
    }>(encrypted, key, iv);

    return decrypted.value;
  }

  private serializeCookie(cookie: unknown): string | null {
    if (!cookie) {
      return null;
    }
    if (Array.isArray(cookie) && cookie.length > 0) {
      return JSON.stringify(cookie);
    }
    if (typeof cookie === 'object' && cookie !== null) {
      const jar = cookie as { toJSON?: () => { cookies?: unknown[] } };
      if (typeof jar.toJSON === 'function') {
        const cookies = jar.toJSON()?.cookies;
        if (Array.isArray(cookies) && cookies.length > 0) {
          return JSON.stringify(cookies);
        }
      }
    }
    if (typeof cookie === 'string') {
      const trimmed = cookie.trim();
      if (!trimmed) {
        return null;
      }
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return trimmed;
        }
      } catch {
        return null;
      }
    }
    return null;
  }
}
