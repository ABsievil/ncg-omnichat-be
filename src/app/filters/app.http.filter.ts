import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type {
  IAppException,
  IResponseMetadata,
} from 'src/app/interfaces/app.interface';
import type { IRequestApp } from 'src/common/request/interfaces/request.interface';
import {
  APP_CONFIG_KEY,
  ERROR_RESPONSE_DEFAULT,
} from 'src/common/response/constants/error-response.constant';
import { ErrorResponseService } from 'src/common/response/services/error-response.service';

@Catch(HttpException)
export class AppHttpFilter implements ExceptionFilter {
  constructor(
    private readonly configService: ConfigService,
    private readonly errorResponse: ErrorResponseService,
  ) {}

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<IRequestApp>();

    const apiPrefix =
      this.configService.get<string>(APP_CONFIG_KEY.API_PREFIX) ??
      ERROR_RESPONSE_DEFAULT.API_PREFIX;
    const landingPath = this.errorResponse.resolvePublicHealthLandingPath();

    const path = request.path ?? '';
    if (!path.startsWith(`/${apiPrefix}`)) {
      response.redirect(HttpStatus.PERMANENT_REDIRECT, landingPath);
      return;
    }

    const status = exception.getStatus();
    const raw = exception.getResponse();
    const baseMeta = this.errorResponse.buildMetadata(request);

    let statusCode = status;
    let errorCode: number | undefined;
    let messageText: string;
    let data: Record<string, unknown> | undefined;
    let metadata: IResponseMetadata = { ...baseMeta };

    if (this.isStructuredPayload(raw)) {
      const r = raw;
      statusCode =
        typeof r.statusCode === 'number' ? r.statusCode : status;
      errorCode = r.errorCode;
      messageText = this.errorResponse.formatHttpExceptionMessage(r.message);
      data = r.data;
      metadata = this.errorResponse.mergeWithoutCustomProperty(
        baseMeta,
        r._metadata,
      );
    } else if (typeof raw === 'string') {
      messageText = raw || exception.message;
    } else if (typeof raw === 'object' && raw !== null && 'message' in raw) {
      const o = raw as Record<string, unknown>;
      statusCode =
        typeof o.statusCode === 'number' ? o.statusCode : status;
      if (typeof o.errorCode === 'number') {
        errorCode = o.errorCode;
      }
      messageText = this.errorResponse.formatHttpExceptionMessage(o.message);
      if (o.data !== undefined) {
        data = o.data as Record<string, unknown>;
      }
    } else {
      messageText = exception.message;
    }

    const body: IAppException = {
      statusCode,
      ...(errorCode !== undefined && { errorCode }),
      message: messageText,
      ...(data !== undefined && { data }),
      _metadata: metadata,
    };

    this.errorResponse.applyHeaders(response, metadata);
    response.status(status).json(body);
  }

  private isStructuredPayload(raw: unknown): raw is IAppException {
    if (typeof raw !== 'object' || raw === null) return false;
    const o = raw as Record<string, unknown>;
    const hasCode =
      typeof o.statusCode === 'number' || typeof o.errorCode === 'number';
    return hasCode && 'message' in o;
  }
}
