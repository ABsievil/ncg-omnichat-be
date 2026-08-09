import {
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { RedisService } from 'src/common/redis/services/redis.service';
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
  private eventSubscriber?: Redis;
  private readonly renewChannel: string;
  private readonly disabledChannel: string;
  private started = false;

  constructor(
    private readonly zaloService: ZaloService,
    private readonly omnichatBotService: OmnichatBotService,
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
      this.teardownHandlersOnly(shopId);
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
        return;
      }

      this.teardownHandlersOnly(shopId);
      this.zaloService.clearApi(shopId);

      const api = await this.zaloService.loginWithSession(shopId, {
        selfListen: false,
      });

      const messageHandler = async (message: unknown) => {
        this.logger.log(`Incoming Zalo event [shop=${shopId}]`);
        try {
          await this.omnichatBotService.handleIncomingMessage(message, shopId);
        } catch (error) {
          this.logger.error(
            `Failed to process incoming Zalo message [shop=${shopId}]: ${String(error)}`,
          );
        }
      };

      const closedHandler = () => {
        this.logger.warn(
          `Zalo listener closed [shop=${shopId}], scheduling reconnect...`,
        );
        this.scheduleReconnect(shopId, attempt);
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
      this.scheduleReconnect(shopId, attempt);
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
    this.cancelReconnect(shopId);
    this.teardownHandlersOnly(shopId);
    this.zaloService.clearApi(shopId);
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
    this.teardownHandlersOnly(shopId);
    this.zaloService.clearApi(shopId);
  }

  private cancelReconnect(shopId: string): void {
    const timer = this.reconnectTimers.get(shopId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(shopId);
    }
  }

  private scheduleReconnect(shopId: string, attempt: number): void {
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
        void this.startListener(shopId, attempt + 1);
      }, delay),
    );
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
      api.listener.off('closed', bound.closedHandler);
      api.listener.off('error', bound.errorHandler);
    } catch {
      // ignore
    }

    this.handlers.delete(shopId);
  }
}
