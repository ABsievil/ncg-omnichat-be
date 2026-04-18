import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cors, { type CorsOptions } from 'cors';
import type { NextFunction, Request, Response } from 'express';
import { MIDDLEWARE_CONFIG_PATH } from 'src/common/request/constants/middleware-config-path.constant';

@Injectable()
export class AppCorsMiddleware implements NestMiddleware {
  private readonly options: CorsOptions;

  constructor(private readonly configService: ConfigService) {
    this.options = {
      origin: this.configService.get(MIDDLEWARE_CONFIG_PATH.CORS_ALLOW_ORIGIN),
      methods: this.configService.get(MIDDLEWARE_CONFIG_PATH.CORS_ALLOW_METHOD),
      allowedHeaders: this.configService.get(
        MIDDLEWARE_CONFIG_PATH.CORS_ALLOW_HEADER,
      ),
      preflightContinue: false,
      credentials: true,
      optionsSuccessStatus: HttpStatus.NO_CONTENT,
    };
  }

  use(req: Request, res: Response, next: NextFunction): void {
    cors(this.options)(req, res, next);
  }
}
