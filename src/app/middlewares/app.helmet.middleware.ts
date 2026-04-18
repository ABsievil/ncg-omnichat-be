import { Injectable, NestMiddleware } from '@nestjs/common';
import helmet from 'helmet';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class AppHelmetMiddleware implements NestMiddleware {
  private readonly handler = helmet();

  use(req: Request, res: Response, next: NextFunction): void {
    this.handler(req, res, next);
  }
}
