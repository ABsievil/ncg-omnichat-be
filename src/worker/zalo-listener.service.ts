import {
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { RedisService } from 'src/common/redis/services/redis.service';
import { BotProfileService } from 'src/modules/bot-profile/services/bot-profile.service';
import { OmnichatBotService } from 'src/modules/omnichat-bot/services/omnichat-bot.service';
import {
  ZALO_REDIS_CHANNEL_SESSION_DISABLED,
  ZALO_REDIS_CHANNEL_SESSION_RENEWED,
} from 'src/modules/zalo/constants/zalo.constant';
import { ENUM_ZALO_SESSION_STATUS } from 'src/modules/zalo/enums/zalo.enum';
import { IZaloListenerHandlers } from 'src/modules/zalo/interfaces/zalo.listener.interface';
import { ZaloService } from 'src/modules/zalo/services/zalo.service';

@Injectable()
export class ZaloListenerService implements OnModuleDestroy {
  private readonly logger = new Logger(ZaloListenerService.name);
  private readonly reconnectTimers = new Map<string, NodeJS.Timeout>();
  private readonly handlers = new Map<string, IZaloListenerHandlers>();
  private readonly starting = new Set<string>();
  /** Shops stopped on purpose (disconnect / destroy) — do not auto-reconnect. */
  private readonly intentionalStops = new Set<string>();
  private eventSubscriber?: Redis;
  private readonly renewChannel: string;
  private readonly disabledChannel: string;
  private started = false;

  constructor(
    private readonly zaloService: ZaloService,
    private readonly omnichatBotService: OmnichatBotService,
    private readonly botProfileService: BotProfileService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.renewChannel = this.redisService.channelKey(
      ZALO_REDIS_CHANNEL_SESSION_RENEWED,
    );
    this.disabledChannel = this.redisService.channelKey(
      ZALO_REDIS_CHANNEL_SESSION_DISABLED,
    );
  }

  /** Explicit entry — ApplicationContext skips OnApplicationBootstrap for request-scoped trees. */
  async startAll(): Promise<void> {
    if (this.started) {
      return;
    }
    this.started = true;

    await this.subscribeSessionEvents();
    const shopIds = await this.zaloService.listActiveShopIds();
    this.logger.log(
      `Bootstrap listeners for ${shopIds.length} active session(s): ${shopIds.join(', ') || '(none)'}`,
    );
    if (shopIds.length === 0) {
      this.logger.warn(
        'No active Zalo sessions found. Waiting for QR login renew...',
      );
      return;
    }
    await Promise.all(shopIds.map(shopId => this.startListener(shopId)));
  }

  onModuleDestroy(): void {
    for (const timer of this.reconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.reconnectTimers.clear();
    for (const shopId of [...this.handlers.keys()]) {
      this.stopListener(shopId);
    }
    this.zaloService.clearAllApis();
    void this.eventSubscriber?.quit();
    this.eventSubscriber = undefined;
  }

  async startListener(shopId: string, attempt = 0): Promise<void> {
    if (this.starting.has(shopId)) {
      return;
    }
    this.starting.add(shopId);

    try {
      const session = await this.zaloService.findSessionByShopId(shopId);
      if (!session || session.status !== ENUM_ZALO_SESSION_STATUS.ACTIVE) {
        this.logger.log(
          `Skip listener start — session not active [shop=${shopId} status=${session?.status ?? 'missing'}]`,
        );
        this.cancelReconnect(shopId);
        return;
      }

      this.intentionalStops.delete(shopId);
      this.stopListener(shopId, { keepIntentional: false });

      const api = await this.zaloService.loginWithSession(shopId, {
        selfListen: true,
      });

      // Re-check after async login — disconnect may have raced in.
      const stillActive = await this.zaloService.findSessionByShopId(shopId);
      if (
        !stillActive ||
        stillActive.status !== ENUM_ZALO_SESSION_STATUS.ACTIVE ||
        this.intentionalStops.has(shopId)
      ) {
        this.logger.log(
          `Abort listener start after login — session no longer active [shop=${shopId}]`,
        );
        this.intentionalStops.add(shopId);
        this.zaloService.clearApi(shopId);
        this.cancelReconnect(shopId);
        return;
      }

      const messageHandler = async (message: unknown) => {
        this.logger.log(`Incoming Zalo event [shop=${shopId}]`);
        try {
          const profile = await this.botProfileService.getOrCreate(shopId);
          await this.omnichatBotService.handleIncomingMessage(message, shopId, {
            profile,
          });
        } catch (error) {
          this.logger.error(
            `Failed to process incoming Zalo message [shop=${shopId}]: ${String(error)}`,
          );
        }
      };

      const closedHandler = () => {
        if (this.intentionalStops.has(shopId)) {
          this.logger.log(
            `Zalo listener closed intentionally [shop=${shopId}], skip reconnect`,
          );
          return;
        }
        this.logger.warn(
          `Zalo listener closed [shop=${shopId}], scheduling reconnect...`,
        );
        void this.scheduleReconnect(shopId, attempt);
      };

      const errorHandler = (error: unknown) => {
        this.logger.error(
          `Zalo listener error [shop=${shopId}]: ${String(error)}`,
        );
      };

      this.handlers.set(shopId, {
        messageHandler,
        closedHandler,
        errorHandler,
      });

      api.listener.on('message', messageHandler);
      api.listener.onConnected(() => {
        this.logger.log(`Zalo listener connected [shop=${shopId}]`);
      });
      api.listener.onClosed(closedHandler);
      api.listener.onError(errorHandler);
      api.listener.start();

      this.logger.log(`Zalo listener started [shop=${shopId}]`);
    } catch (error) {
      this.logger.error(
        `Failed to start Zalo listener [shop=${shopId}]: ${String(error)}`,
      );
      await this.scheduleReconnect(shopId, attempt);
    } finally {
      this.starting.delete(shopId);
    }
  }

  private async subscribeSessionEvents(): Promise<void> {
    try {
      this.eventSubscriber = this.redisService.duplicateClient();
      await this.eventSubscriber.subscribe(
        this.renewChannel,
        this.disabledChannel,
      );
      this.eventSubscriber.on('message', (channel, raw) => {
        if (channel === this.renewChannel) {
          void this.handleSessionRenewed(raw);
          return;
        }
        if (channel === this.disabledChannel) {
          void this.handleSessionDisabled(raw);
        }
      });
      this.logger.log(
        `Subscribed session channels: ${this.renewChannel}, ${this.disabledChannel}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to subscribe session channels: ${String(error)}`,
      );
    }
  }

  private parseShopIdPayload(raw: string): string | null {
    try {
      const payload = JSON.parse(raw) as { shopId?: string };
      const shopId = payload.shopId?.trim() || '';
      return shopId || null;
    } catch {
      return null;
    }
  }

  private async handleSessionRenewed(raw: string): Promise<void> {
    const shopId = this.parseShopIdPayload(raw);
    if (!shopId) {
      this.logger.warn(`Invalid session renew payload: ${raw}`);
      return;
    }

    this.logger.log(`Session renewed [shop=${shopId}], restarting listener...`);
    this.intentionalStops.delete(shopId);
    this.cancelReconnect(shopId);
    this.stopListener(shopId, { keepIntentional: false });
    await this.startListener(shopId, 0);
  }

  private async handleSessionDisabled(raw: string): Promise<void> {
    const shopId = this.parseShopIdPayload(raw);
    if (!shopId) {
      this.logger.warn(`Invalid session disabled payload: ${raw}`);
      return;
    }

    this.logger.log(
      `Session disabled [shop=${shopId}], stopping listener (no auto-reply)...`,
    );
    this.cancelReconnect(shopId);
    this.stopListener(shopId);
  }

  private cancelReconnect(shopId: string): void {
    const timer = this.reconnectTimers.get(shopId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(shopId);
    }
  }

  private async scheduleReconnect(
    shopId: string,
    attempt: number,
  ): Promise<void> {
    if (this.intentionalStops.has(shopId)) {
      return;
    }

    const session = await this.zaloService.findSessionByShopId(shopId);
    if (!session || session.status !== ENUM_ZALO_SESSION_STATUS.ACTIVE) {
      this.logger.log(
        `Skip reconnect — session not active [shop=${shopId} status=${session?.status ?? 'missing'}]`,
      );
      this.cancelReconnect(shopId);
      return;
    }

    this.cancelReconnect(shopId);

    const maxAttempts =
      this.configService.get<number>('zalo.maxReconnectAttempts') ?? 5;
    const baseDelay =
      this.configService.get<number>('zalo.reconnectDelayMs') ?? 15_000;

    if (attempt >= maxAttempts) {
      this.logger.error(
        `Max reconnect attempts (${maxAttempts}) reached for [shop=${shopId}]. Mark session expired.`,
      );
      void this.zaloService.markSessionStatus(
        ENUM_ZALO_SESSION_STATUS.EXPIRED,
        shopId,
      );
      return;
    }

    const delay = baseDelay * Math.pow(2, attempt);
    this.logger.warn(
      `Reconnect [shop=${shopId}] attempt ${attempt + 1}/${maxAttempts} in ${delay}ms`,
    );

    this.reconnectTimers.set(
      shopId,
      setTimeout(() => {
        if (this.intentionalStops.has(shopId)) {
          return;
        }
        void this.startListener(shopId, attempt + 1);
      }, delay),
    );
  }

  /**
   * Mark intentional stop, detach handlers, and stop the websocket.
   * `keepIntentional` defaults true so closed events after stop do not reconnect.
   */
  private stopListener(
    shopId: string,
    opts?: { keepIntentional?: boolean },
  ): void {
    const keepIntentional = opts?.keepIntentional ?? true;
    if (keepIntentional) {
      this.intentionalStops.add(shopId);
    }

    this.teardownHandlersOnly(shopId);
    this.zaloService.clearApi(shopId);
  }

  private teardownHandlersOnly(shopId: string): void {
    const api = this.zaloService.getApi(shopId);
    const bound = this.handlers.get(shopId);
    if (!api || !bound) {
      this.handlers.delete(shopId);
      return;
    }

    try {
      api.listener.off('message', bound.messageHandler);
      // onClosed/onError are single callback slots (not EventEmitter) — must overwrite.
      api.listener.onClosed(() => undefined);
      api.listener.onError(() => undefined);
      api.listener.onConnected(() => undefined);
    } catch {
      // ignore
    }

    this.handlers.delete(shopId);
  }
}
