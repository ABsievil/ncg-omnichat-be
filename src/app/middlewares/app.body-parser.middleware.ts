import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json, raw, text, urlencoded } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { MIDDLEWARE_CONFIG_PATH } from 'src/common/request/constants/middleware-config-path.constant';

@Injectable()
export class AppJsonBodyParserMiddleware implements NestMiddleware {
  private readonly handler: ReturnType<typeof json>;

  constructor(private readonly configService: ConfigService) {
    const limit =
      this.configService.get<string>(MIDDLEWARE_CONFIG_PATH.BODY_JSON_LIMIT) ??
      '1mb';
    this.handler = json({ limit });
  }

  use(req: Request, res: Response, next: NextFunction): void {
    this.handler(req, res, next);
  }
}

@Injectable()
export class AppUrlencodedBodyParserMiddleware implements NestMiddleware {
  private readonly handler: ReturnType<typeof urlencoded>;

  constructor(private readonly configService: ConfigService) {
    const limit =
      this.configService.get<string>(
        MIDDLEWARE_CONFIG_PATH.BODY_URLENCODED_LIMIT,
      ) ?? '1mb';
    const extended =
      this.configService.get<boolean>(
        MIDDLEWARE_CONFIG_PATH.BODY_URLENCODED_EXTENDED,
      ) ?? false;
    this.handler = urlencoded({ extended, limit });
  }

  use(req: Request, res: Response, next: NextFunction): void {
    this.handler(req, res, next);
  }
}

@Injectable()
export class AppRawBodyParserMiddleware implements NestMiddleware {
  private readonly handler: ReturnType<typeof raw>;

  constructor(private readonly configService: ConfigService) {
    const limit =
      this.configService.get<string>(MIDDLEWARE_CONFIG_PATH.BODY_RAW_LIMIT) ??
      '1mb';
    this.handler = raw({ limit });
  }

  use(req: Request, res: Response, next: NextFunction): void {
    this.handler(req, res, next);
  }
}

@Injectable()
export class AppTextBodyParserMiddleware implements NestMiddleware {
  private readonly handler: ReturnType<typeof text>;

  constructor(private readonly configService: ConfigService) {
    const limit =
      this.configService.get<string>(MIDDLEWARE_CONFIG_PATH.BODY_TEXT_LIMIT) ??
      '1mb';
    this.handler = text({ limit });
  }

  use(req: Request, res: Response, next: NextFunction): void {
    this.handler(req, res, next);
  }
}
