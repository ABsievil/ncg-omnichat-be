import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Observable, Subscriber } from 'rxjs';
import { SkipRequestTimeout } from 'src/common/request/decorators/request.decorator';
import { Response } from 'src/common/response/decorators/response.decorator';
import { IResponse } from 'src/common/response/interfaces/response.interface';
import { RequireTenantShop } from 'src/modules/auth/decorators/require-tenant-shop.decorator';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { ShopTenantProtected } from 'src/modules/auth/decorators/shop-tenant-protected.decorator';
import { TenantShopId } from 'src/modules/auth/decorators/tenant-shop.decorator';
import { BotProfileService } from 'src/modules/bot-profile/services/bot-profile.service';
import { ENUM_USER_ROLE } from 'src/modules/user/enums/user.enum';
import { ZaloLoginQrRequestDto } from 'src/modules/zalo/dtos/request/zalo.login-qr.request.dto';
import { ZaloSendRequestDto } from 'src/modules/zalo/dtos/request/zalo.send.request.dto';
import { ZaloSessionDisconnectRequestDto } from 'src/modules/zalo/dtos/request/zalo.session.disconnect.request.dto';
import { ZaloSessionUpsertRequestDto } from 'src/modules/zalo/dtos/request/zalo.session.upsert.request.dto';
import { ZaloSendResponseDataDto } from 'src/modules/zalo/dtos/response/zalo.send.response.data.dto';
import { ZaloSessionGetResponseDataDto } from 'src/modules/zalo/dtos/response/zalo.session.get.response.data.dto';
import { ZaloSessionListResponseDataDto } from 'src/modules/zalo/dtos/response/zalo.session.list.response.data.dto';
import { ZaloSessionError } from 'src/modules/zalo/errors/zalo.session.error';
import { ZaloService } from 'src/modules/zalo/services/zalo.service';

@ShopTenantProtected()
@Controller({ version: '1', path: '/zalo' })
export class ZaloAdminController {
  constructor(
    private readonly zaloService: ZaloService,
    private readonly botProfileService: BotProfileService,
    private readonly zaloSessionError: ZaloSessionError,
  ) {}

  @Response('zalo.list')
  @Get('/sessions')
  async listSessions(
    @TenantShopId() shopId?: string,
  ): Promise<IResponse<ZaloSessionListResponseDataDto>> {
    const sessions = await this.zaloService.listSessions(shopId);
    return { data: this.zaloService.mapListData(sessions) };
  }

  @RequireTenantShop()
  @Response('zalo.get')
  @Get('/sessions/detail')
  async getSession(
    @TenantShopId() shopId: string,
  ): Promise<IResponse<ZaloSessionGetResponseDataDto>> {
    const session = await this.zaloService.getSession(shopId);
    return { data: this.zaloService.mapGetData(session) };
  }

  @RequireTenantShop()
  @Response('zalo.create')
  @Post('/sessions')
  async upsertSession(
    @TenantShopId() shopId: string,
    @Body() dto: ZaloSessionUpsertRequestDto,
  ): Promise<IResponse<ZaloSessionGetResponseDataDto>> {
    const session = await this.zaloService.upsertSession({
      ...dto,
      shopId,
    });
    return { data: this.zaloService.mapGetData(session) };
  }

  @RequireTenantShop()
  @Response('zalo.disconnect')
  @Post('/sessions/disconnect')
  async disconnectSession(
    @TenantShopId() shopId: string,
    @Body() _dto: ZaloSessionDisconnectRequestDto,
  ): Promise<IResponse<ZaloSessionGetResponseDataDto>> {
    const session = await this.zaloService.disconnectSession(shopId);
    return { data: this.zaloService.mapGetData(session) };
  }

  @Roles(ENUM_USER_ROLE.ADMIN)
  @RequireTenantShop()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Response('zalo.send')
  @Post('/send')
  async send(
    @TenantShopId() shopId: string,
    @Body() dto: ZaloSendRequestDto,
  ): Promise<IResponse<ZaloSendResponseDataDto>> {
    const response = await this.zaloService.sendMessage({
      ...dto,
      shopId,
    });
    return {
      data: {
        result: { success: true, response },
        createdBy: [],
        updatedBy: [],
      },
    };
  }

  /**
   * SSE QR login stream — 1 Zalo account / shop.
   * Events: qr | scanned | declined | expired | login_success | error
   */
  @RequireTenantShop()
  @SkipRequestTimeout()
  @Sse('login-qr')
  async loginQr(
    @TenantShopId() shopId: string,
    @Query() query: ZaloLoginQrRequestDto,
  ): Promise<Observable<MessageEvent>> {
    const profile = await this.botProfileService.getOrCreate(shopId);
    if (!this.botProfileService.hasAcceptedZaloRisk(profile)) {
      this.zaloSessionError.throwRiskNotAccepted();
    }

    return new Observable((subscriber: Subscriber<MessageEvent>) => {
      let closed = false;

      const push = (event: string, data: unknown) => {
        if (closed) {
          return;
        }
        subscriber.next({
          type: event,
          data: JSON.stringify(data),
        } as MessageEvent);
      };

      void (async () => {
        try {
          const { credentials } = await this.zaloService.loginQr(
            qrEvent => {
              switch (qrEvent.type) {
                case 0:
                  push('qr', {
                    image: qrEvent.data?.image ?? null,
                    mimeType: 'image/png',
                    encoding: 'base64',
                  });
                  break;
                case 1:
                  push('expired', { message: 'QR code expired' });
                  break;
                case 2:
                  push('scanned', {
                    displayName: qrEvent.data?.display_name ?? null,
                    avatar: qrEvent.data?.avatar ?? null,
                  });
                  break;
                case 3:
                  push('declined', { code: qrEvent.data?.code ?? null });
                  break;
                case 4:
                  push('got_login_info', {
                    hasCookie: Array.isArray(qrEvent.data?.cookie),
                    hasImei: !!qrEvent.data?.imei,
                  });
                  break;
                default:
                  push('unknown', { type: qrEvent.type });
              }
            },
            {
              shopId,
              proxy: query.proxy,
            },
          );

          const session = await this.zaloService.getSession(shopId);
          push('login_success', {
            data: this.zaloService.mapGetData(session),
            imeiPresent: !!credentials.imei,
          });
          subscriber.complete();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          push('error', { message });
          subscriber.complete();
        }
      })();

      return () => {
        closed = true;
      };
    });
  }
}
