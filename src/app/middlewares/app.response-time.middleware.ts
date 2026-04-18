import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import { MIDDLEWARE_CONFIG_PATH } from 'src/common/request/constants/middleware-config-path.constant';

@Injectable()
export class AppResponseTimeMiddleware implements NestMiddleware {
  private readonly headerName: string;

  constructor(private readonly configService: ConfigService) {
    this.headerName =
      this.configService.get<string>(
        MIDDLEWARE_CONFIG_PATH.RESPONSE_TIME_HEADER,
      ) ?? 'x-response-time';
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const start = process.hrtime.bigint();
    const headerName = this.headerName;
    const end = res.end.bind(res);
    res.end = ((...args: unknown[]) => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      res.setHeader(headerName, `${ms.toFixed(3)}ms`);
      return (end as (...a: unknown[]) => unknown)(...args);
    }) as typeof res.end;
    next();
  }
}
