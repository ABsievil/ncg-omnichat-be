import {
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ThreadType, Zalo, type API } from 'zca-js';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.connection.constant';
import { HelperEncryptionService } from 'src/common/helper/services/helper.encryption.service';
import {
  ZALO_DEFAULT_ACCOUNT_LABEL,
  ZALO_LOGIN_MAX_RETRIES,
  ZALO_LOGIN_RETRY_DELAY_MS,
} from 'src/modules/zalo/constants/zalo.constant';
import {
  ZaloSessionDoc,
  ZaloSessionEntity,
} from 'src/modules/zalo/entities/zalo-session.entity';
import { ENUM_ZALO_SESSION_STATUS, ENUM_ZALO_THREAD_TYPE } from 'src/modules/zalo/enums/zalo.enum';
import { ZaloSessionError } from 'src/modules/zalo/errors/zalo.session.error';
import {
  IZaloMessage,
  IZaloQrEvent,
  IZaloSendMessageInput,
  IZaloSessionCredentials,
} from 'src/modules/zalo/interfaces/zalo.interface';
import { ZaloSessionUpsertRequestDto } from 'src/modules/zalo/dtos/request/zalo.session.upsert.request.dto';
import { ZaloSessionResponseDto } from 'src/modules/zalo/dtos/response/zalo.session.response.dto';

@Injectable()
export class ZaloService implements OnModuleDestroy {
  private readonly logger = new Logger(ZaloService.name);
  private api: API | undefined;

  constructor(
    @InjectModel(ZaloSessionEntity.name, DATABASE_CONNECTION_NAME)
    private readonly sessionModel: Model<ZaloSessionEntity>,
    private readonly configService: ConfigService,
    private readonly helperEncryptionService: HelperEncryptionService,
    private readonly zaloSessionError: ZaloSessionError,
  ) {}

  onModuleDestroy(): void {
    this.stopListener();
  }

  isConnected(): boolean {
    return !!this.api;
  }

  getApi(): API | undefined {
    return this.api;
  }

  async upsertSession(
    dto: ZaloSessionUpsertRequestDto,
  ): Promise<ZaloSessionResponseDto> {
    const accountLabel = dto.accountLabel?.trim() || ZALO_DEFAULT_ACCOUNT_LABEL;
    const { cookieEncrypted, cookieIv } = this.encryptSecret(dto.cookie);
    const proxy =
      dto.proxy?.trim() ||
      this.configService.get<string>('zalo.proxy') ||
      null;

    const session = await this.sessionModel
      .findOneAndUpdate(
        { accountLabel, deleted: false },
        {
          $set: {
            accountLabel,
            cookieEncrypted,
            cookieIv,
            imei: dto.imei,
            userAgent: dto.userAgent,
            proxy,
            status: ENUM_ZALO_SESSION_STATUS.ACTIVE,
            lastLoginAt: new Date(),
            deleted: false,
          },
        },
        { upsert: true, new: true },
      )
      .exec();

    return this.mapSession(session);
  }

  async getSession(
    accountLabel = ZALO_DEFAULT_ACCOUNT_LABEL,
  ): Promise<ZaloSessionResponseDto | null> {
    const session = await this.sessionModel
      .findOne({ accountLabel, deleted: false })
      .exec();
    return session ? this.mapSession(session) : null;
  }

  async markSessionStatus(
    status: ENUM_ZALO_SESSION_STATUS,
    accountLabel = ZALO_DEFAULT_ACCOUNT_LABEL,
  ): Promise<void> {
    await this.sessionModel
      .updateOne({ accountLabel, deleted: false }, { $set: { status } })
      .exec();
  }

  async loadCredentials(
    accountLabel = ZALO_DEFAULT_ACCOUNT_LABEL,
  ): Promise<IZaloSessionCredentials> {
    const session = await this.sessionModel
      .findOne({ accountLabel, deleted: false })
      .select('+cookieEncrypted +cookieIv +imei +userAgent')
      .exec();

    ZaloSessionError.assertActive(session);

    return {
      cookie: this.decryptSecret(session.cookieEncrypted, session.cookieIv),
      imei: session.imei,
      userAgent: session.userAgent,
      proxy: session.proxy ?? this.configService.get<string>('zalo.proxy') ?? undefined,
    };
  }

  async loginWithSession(
    accountLabel = ZALO_DEFAULT_ACCOUNT_LABEL,
    opts?: { selfListen?: boolean },
  ): Promise<API> {
    const credentials = await this.loadCredentials(accountLabel);
    this.api = await this.loginWithRetry(credentials, {
      selfListen: opts?.selfListen ?? false,
    });

    try {
      const ownId =
        typeof this.api.getOwnId === 'function'
          ? String(this.api.getOwnId())
          : null;
      await this.sessionModel
        .updateOne(
          { accountLabel, deleted: false },
          {
            $set: {
              status: ENUM_ZALO_SESSION_STATUS.ACTIVE,
              lastLoginAt: new Date(),
              ...(ownId ? { ownId } : {}),
            },
          },
        )
        .exec();
    } catch (error) {
      this.logger.warn(`Failed to refresh session metadata: ${String(error)}`);
    }

    return this.api;
  }

  async loginQr(
    onEvent: (event: IZaloQrEvent) => void,
    options?: { accountLabel?: string; proxy?: string },
  ): Promise<{ api: API; credentials: IZaloSessionCredentials }> {
    const accountLabel =
      options?.accountLabel?.trim() || ZALO_DEFAULT_ACCOUNT_LABEL;
    const proxy =
      options?.proxy?.trim() ||
      this.configService.get<string>('zalo.proxy') ||
      undefined;

    await this.sessionModel
      .findOneAndUpdate(
        { accountLabel, deleted: false },
        {
          $set: {
            accountLabel,
            status: ENUM_ZALO_SESSION_STATUS.PENDING_QR,
            deleted: false,
          },
          $setOnInsert: {
            cookieEncrypted: '[]',
            imei: '',
            userAgent: '',
          },
        },
        { upsert: true },
      )
      .exec();

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
          accountLabel,
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
      accountLabel,
      cookie: credentials.cookie,
      imei: credentials.imei,
      userAgent: credentials.userAgent,
      proxy,
    });

    this.api = api;
    return { api, credentials };
  }

  async sendMessage(input: IZaloSendMessageInput): Promise<unknown> {
    const api = await this.ensureApi();
    const type =
      input.type === ENUM_ZALO_THREAD_TYPE.GROUP
        ? ThreadType.Group
        : ThreadType.User;

    try {
      await api.sendTypingEvent(input.threadId, type);
    } catch {
      this.logger.debug('sendTypingEvent failed (ignored)');
    }

    try {
      return await api.sendMessage({ msg: input.message }, input.threadId, type);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.zaloSessionError.throwSendFailed(reason);
    }
  }

  async sendTyping(
    threadId: string,
    type: ENUM_ZALO_THREAD_TYPE = ENUM_ZALO_THREAD_TYPE.USER,
  ): Promise<void> {
    const api = await this.ensureApi();
    const threadType =
      type === ENUM_ZALO_THREAD_TYPE.GROUP
        ? ThreadType.Group
        : ThreadType.User;
    await api.sendTypingEvent(threadId, threadType);
  }

  normalizeIncomingMessage(message: unknown): IZaloMessage | null {
    if (!message || typeof message !== 'object') {
      return null;
    }

    const msg = message as Record<string, any>;
    const data = msg.data ?? {};
    const content = data.content;
    if (typeof content !== 'string' || !content.trim()) {
      return null;
    }

    const threadType =
      msg.type === ThreadType.Group || msg.type === 1
        ? ENUM_ZALO_THREAD_TYPE.GROUP
        : ENUM_ZALO_THREAD_TYPE.USER;

    return {
      isSelf: !!msg.isSelf,
      threadId: String(msg.threadId ?? ''),
      type: threadType,
      userId: String(data.uidFrom ?? msg.threadId ?? ''),
      userName: data.dName ? String(data.dName) : undefined,
      messageContent: content.trim(),
      raw: message,
    };
  }

  stopListener(): void {
    if (!this.api) {
      return;
    }
    try {
      this.api.listener.stop();
    } catch (error) {
      this.logger.warn(`Failed to stop Zalo listener: ${String(error)}`);
    }
  }

  mapSession(session: ZaloSessionDoc | ZaloSessionEntity): ZaloSessionResponseDto {
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
      accountLabel: doc.accountLabel,
      status: doc.status,
      ownId: doc.ownId ?? null,
      proxy: doc.proxy ?? null,
      lastLoginAt: doc.lastLoginAt ?? null,
    };
  }

  private async ensureApi(): Promise<API> {
    if (this.api) {
      return this.api;
    }
    return this.loginWithSession();
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
