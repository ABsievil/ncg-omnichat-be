import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { Observable, Subscriber } from 'rxjs';
import { Response } from 'src/common/response/decorators/response.decorator';
import { ZaloLoginQrRequestDto } from 'src/modules/zalo/dtos/request/zalo.login-qr.request.dto';
import { ZaloSendRequestDto } from 'src/modules/zalo/dtos/request/zalo.send.request.dto';
import { ZaloSessionUpsertRequestDto } from 'src/modules/zalo/dtos/request/zalo.session.upsert.request.dto';
import { ZaloService } from 'src/modules/zalo/services/zalo.service';
import { ZALO_DEFAULT_ACCOUNT_LABEL } from 'src/modules/zalo/constants/zalo.constant';

@Controller({ version: '1', path: '/zalo' })
export class ZaloAdminController {
  constructor(private readonly zaloService: ZaloService) {}

  @Response('zalo.sessionGet')
  @Get('/sessions')
  async getSession(
    @Query('accountLabel') accountLabel?: string,
  ) {
    const data = await this.zaloService.getSession(
      accountLabel || ZALO_DEFAULT_ACCOUNT_LABEL,
    );
    return { data };
  }

  @Response('zalo.sessionUpsert')
  @Post('/sessions')
  async upsertSession(@Body() dto: ZaloSessionUpsertRequestDto) {
    const data = await this.zaloService.upsertSession(dto);
    return { data };
  }

  @Response('zalo.send')
  @Post('/send')
  async send(@Body() dto: ZaloSendRequestDto) {
    const response = await this.zaloService.sendMessage(dto);
    return { data: { success: true, response } };
  }

  /**
   * SSE QR login stream.
   * Events: qr | scanned | declined | expired | login_success | error
   */
  @Sse('login-qr')
  loginQr(
    @Query() query: ZaloLoginQrRequestDto,
  ): Observable<MessageEvent> {
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
              accountLabel: query.accountLabel,
              proxy: query.proxy,
            },
          );

          const session = await this.zaloService.getSession(
            query.accountLabel || ZALO_DEFAULT_ACCOUNT_LABEL,
          );
          push('login_success', {
            session,
            imeiPresent: !!credentials.imei,
          });
          subscriber.complete();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          push('error', { message });
          subscriber.error(error);
        }
      })();

      return () => {
        closed = true;
      };
    });
  }
}
