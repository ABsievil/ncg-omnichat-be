import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Response } from 'express';
import {
  APP_CONFIG_KEY,
  ERROR_RESPONSE_DEFAULT,
} from 'src/common/response/constants/error-response.constant';
import { MIDDLEWARE_CONFIG_PATH } from 'src/common/request/constants/middleware-config-path.constant';
import type { IRequestApp } from 'src/common/request/interfaces/request.interface';

@Injectable()
export class AppUrlVersionMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(
    req: IRequestApp,
    _res: Response,
    next: NextFunction,
  ): void {
    const fromPath =
      this.configService.get<boolean>(
        MIDDLEWARE_CONFIG_PATH.URL_VERSION_FROM_PATH,
      ) ?? true;

    const apiPrefix =
      this.configService.get<string>(APP_CONFIG_KEY.API_PREFIX) ??
      ERROR_RESPONSE_DEFAULT.API_PREFIX;

    const defaultVersion =
      this.configService.get<string>(APP_CONFIG_KEY.API_VERSION) ??
      ERROR_RESPONSE_DEFAULT.API_VERSION;

    if (!fromPath) {
      req.__version = defaultVersion;
      next();
      return;
    }

    const segments = req.path.split('/').filter(Boolean);
    const prefixIndex = segments.findIndex((s) => s === apiPrefix);
    let version = defaultVersion;

    if (prefixIndex >= 0) {
      const candidate = segments[prefixIndex + 1];
      if (candidate?.startsWith('v')) {
        const parsed = candidate.slice(1);
        if (parsed.length > 0) {
          version = parsed;
        }
      }
    }

    req.__version = version;
    next();
  }
}
