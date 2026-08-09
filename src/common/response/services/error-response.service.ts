import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { IResponseMetadata } from 'src/app/interfaces/app.interface';
import type { IRequestApp } from 'src/common/request/interfaces/request.interface';
import {
  APP_CONFIG_KEY,
  ERROR_RESPONSE_DEFAULT,
} from 'src/common/response/constants/error-response.constant';
import { ErrorResponseHeader } from 'src/common/response/enums/error-response.enum';

@Injectable()
export class ErrorResponseService {
  constructor(private readonly configService: ConfigService) {}

  buildMetadata(req: IRequestApp): IResponseMetadata {
    const apiVersion =
      this.configService.get<string>(APP_CONFIG_KEY.API_VERSION) ??
      ERROR_RESPONSE_DEFAULT.API_VERSION;

    return {
      language: req.__language ?? ERROR_RESPONSE_DEFAULT.LANGUAGE,
      timestamp: new Date().toISOString(),
      timezone: ERROR_RESPONSE_DEFAULT.TIMEZONE,
      path: req.originalUrl ?? req.url ?? '',
      version: req.__version ?? apiVersion,
      release:
        this.configService.get<string>(APP_CONFIG_KEY.RELEASE) ??
        ERROR_RESPONSE_DEFAULT.RELEASE,
    };
  }

  applyHeaders(res: Response, meta: IResponseMetadata): void {
    if (meta.language) {
      res.setHeader(ErrorResponseHeader.Language, meta.language);
    }
    if (meta.timestamp) {
      res.setHeader(ErrorResponseHeader.Timestamp, meta.timestamp);
    }
    if (meta.timezone) {
      res.setHeader(ErrorResponseHeader.Timezone, meta.timezone);
    }
    if (meta.version) {
      res.setHeader(ErrorResponseHeader.ApiVersion, meta.version);
    }
    if (meta.release) {
      res.setHeader(ErrorResponseHeader.Release, meta.release);
    }
  }

  mergeWithoutCustomProperty(
    base: IResponseMetadata,
    extended: IResponseMetadata | undefined,
  ): IResponseMetadata {
    if (!extended) return base;
    const rest = { ...extended };
    delete rest.customProperty;
    return { ...base, ...rest };
  }

  resolvePublicHealthLandingPath(): string {
    const prefix =
      this.configService.get<string>(APP_CONFIG_KEY.API_PREFIX) ??
      ERROR_RESPONSE_DEFAULT.API_PREFIX;
    const version =
      this.configService.get<string>(APP_CONFIG_KEY.API_VERSION) ??
      ERROR_RESPONSE_DEFAULT.API_VERSION;
    return `/${prefix}/v${version}/public/health`;
  }

  formatHttpExceptionMessage(message: unknown): string {
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message)) {
      return message
        .filter((m): m is string => typeof m === 'string')
        .join('; ');
    }
    return String(message ?? '');
  }
}
