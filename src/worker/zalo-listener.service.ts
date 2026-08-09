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
import {
  ZALO_DEFAULT_ACCOUNT_LABEL,
  ZALO_REDIS_CHANNEL_SESSION_RENEWED,
} from 'src/modules/zalo/constants/zalo.constant';
import { ENUM_ZALO_SESSION_STATUS } from 'src/modules/zalo/enums/zalo.enum';
import { ZaloService } from 'src/modules/zalo/services/zalo.service';

@Injectable()
export class ZaloListenerService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(ZaloListenerService.name);
  private reconnectTimer: NodeJS.Timeout | undefined;
  private messageHandler?: (message: unknown) => Promise<void>;
  private closedHandler?: () => void;
  private errorHandler?: (error: unknown) => void;
  private starting = false;
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
    await this.startListener();
  }

  onModuleDestroy(): void {
    this.teardown();
    void this.renewSubscriber?.quit();
    this.renewSubscriber = undefined;
  }

  async startListener(attempt = 0): Promise<void> {
    if (this.starting) {
      return;
    }
    this.starting = true;

    try {
      this.teardownHandlersOnly();
      this.zaloService.clearApi();

      const api = await this.zaloService.loginWithSession(
        ZALO_DEFAULT_ACCOUNT_LABEL,
        { selfListen: false },
      );

      this.messageHandler = async (message: unknown) => {
        try {
          await this.omnichatBotService.handleIncomingMessage(message);
        } catch (error) {
          this.logger.error(
            `Failed to process incoming Zalo message: ${String(error)}`,
          );
        }
      };

      this.closedHandler = () => {
        this.logger.warn('Zalo listener closed, scheduling reconnect...');
        this.scheduleReconnect(attempt);
      };

      this.errorHandler = (error: unknown) => {
        this.logger.error(`Zalo listener error: ${String(error)}`);
      };

      api.listener.on('message', this.messageHandler);
      api.listener.onConnected(() => {
        this.logger.log('Zalo listener connected');
      });
      api.listener.onClosed(this.closedHandler);
      api.listener.onError(this.errorHandler);
      api.listener.start();

      this.logger.log('Zalo listener started');
    } catch (error) {
      this.logger.error(`Failed to start Zalo listener: ${String(error)}`);
      this.scheduleReconnect(attempt);
    } finally {
      this.starting = false;
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
    let accountLabel = ZALO_DEFAULT_ACCOUNT_LABEL;
    try {
      const payload = JSON.parse(raw) as { accountLabel?: string };
      if (payload.accountLabel?.trim()) {
        accountLabel = payload.accountLabel.trim();
      }
    } catch {
      this.logger.warn(`Invalid session renew payload: ${raw}`);
      return;
    }

    // Worker hiện chỉ listen 1 acc (default).
    if (accountLabel !== ZALO_DEFAULT_ACCOUNT_LABEL) {
      this.logger.warn(
        `Ignore session renew for accountLabel=${accountLabel} (worker listens ${ZALO_DEFAULT_ACCOUNT_LABEL})`,
      );
      return;
    }

    this.logger.log(
      `Session renewed for ${accountLabel}, restarting Zalo listener...`,
    );

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    this.teardownHandlersOnly();
    this.zaloService.clearApi();
    await this.startListener(0);
  }

  private scheduleReconnect(attempt: number): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const maxAttempts =
      this.configService.get<number>('zalo.maxReconnectAttempts') ?? 5;
    const baseDelay =
      this.configService.get<number>('zalo.reconnectDelayMs') ?? 15_000;

    if (attempt >= maxAttempts) {
      this.logger.error(
        `Max reconnect attempts (${maxAttempts}) reached. Mark session expired and wait for QR renew.`,
      );
      void this.zaloService.markSessionStatus(ENUM_ZALO_SESSION_STATUS.EXPIRED);
      return;
    }

    const delay = baseDelay * Math.pow(2, attempt);
    this.logger.warn(
      `Reconnect attempt ${attempt + 1}/${maxAttempts} in ${delay}ms`,
    );

    this.reconnectTimer = setTimeout(() => {
      void this.startListener(attempt + 1);
    }, delay);
  }

  private teardown(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    this.teardownHandlersOnly();
    this.zaloService.clearApi();
  }

  private teardownHandlersOnly(): void {
    const api = this.zaloService.getApi();
    if (!api) {
      this.messageHandler = undefined;
      this.closedHandler = undefined;
      this.errorHandler = undefined;
      return;
    }

    try {
      if (this.messageHandler) {
        api.listener.off('message', this.messageHandler);
      }
      if (this.closedHandler) {
        api.listener.off('closed', this.closedHandler);
      }
      if (this.errorHandler) {
        api.listener.off('error', this.errorHandler);
      }
    } catch {
      // ignore
    }

    this.messageHandler = undefined;
    this.closedHandler = undefined;
    this.errorHandler = undefined;
  }
}
