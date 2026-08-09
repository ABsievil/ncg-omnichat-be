import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { RedisService } from 'src/common/redis/services/redis.service';
import { OmnichatBotService } from 'src/modules/omnichat-bot/services/omnichat-bot.service';
import { ZALO_REDIS_CHANNEL_SESSION_RENEWED } from 'src/modules/zalo/constants/zalo.constant';
import { ENUM_ZALO_SESSION_STATUS } from 'src/modules/zalo/enums/zalo.enum';
import { IZaloListenerHandlers } from 'src/modules/zalo/interfaces/zalo.listener.interface';
import { ZaloService } from 'src/modules/zalo/services/zalo.service';

@Injectable()
export class ZaloListenerService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(ZaloListenerService.name);
  private readonly reconnectTimers = new Map<string, NodeJS.Timeout>();
  private readonly handlers = new Map<string, IZaloListenerHandlers>();
  private readonly starting = new Set<string>();
  private renewSubscriber?: Redis;
  private readonly renewChannel: string;

  constructor(
    private readonly zaloService: ZaloService,
    private readonly omnichatBotService: OmnichatBotService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.renewChannel = this.redisService.channelKey(
      ZALO_REDIS_CHANNEL_SESSION_RENEWED,
    );
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.subscribeSessionRenewals();
    const shopIds = await this.zaloService.listActiveShopIds();
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
    void this.renewSubscriber?.quit();
    this.renewSubscriber = undefined;
  }

  async startListener(shopId: string, attempt = 0): Promise<void> {
    if (this.starting.has(shopId)) {
      return;
    }
    this.starting.add(shopId);

    try {
      this.teardownHandlersOnly(shopId);
      this.zaloService.clearApi(shopId);

      const api = await this.zaloService.loginWithSession(shopId, {
        selfListen: false,
      });

      const messageHandler = async (message: unknown) => {
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

  private async subscribeSessionRenewals(): Promise<void> {
    try {
      this.renewSubscriber = this.redisService.duplicateClient();
      await this.renewSubscriber.subscribe(this.renewChannel);
      this.renewSubscriber.on('message', (channel, raw) => {
        if (channel !== this.renewChannel) {
          return;
        }
        void this.handleSessionRenewed(raw);
      });
      this.logger.log(
        `Subscribed session renew channel: ${this.renewChannel}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to subscribe session renew channel: ${String(error)}`,
      );
    }
  }

  private async handleSessionRenewed(raw: string): Promise<void> {
    let shopId = '';
    try {
      const payload = JSON.parse(raw) as { shopId?: string };
      shopId = payload.shopId?.trim() || '';
    } catch {
      this.logger.warn(`Invalid session renew payload: ${raw}`);
      return;
    }

    if (!shopId) {
      this.logger.warn('Session renew missing shopId, ignored');
      return;
    }

    this.logger.log(`Session renewed [shop=${shopId}], restarting listener...`);

    const timer = this.reconnectTimers.get(shopId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(shopId);
    }

    this.teardownHandlersOnly(shopId);
    this.zaloService.clearApi(shopId);
    await this.startListener(shopId, 0);
  }

  private scheduleReconnect(shopId: string, attempt: number): void {
    const existing = this.reconnectTimers.get(shopId);
    if (existing) {
      clearTimeout(existing);
    }

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
