import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Response } from 'express';
import type { IRequestApp } from 'src/common/request/interfaces/request.interface';

@Injectable()
export class AppRequestIdMiddleware implements NestMiddleware {
  use(
    req: IRequestApp,
    _res: Response,
    next: NextFunction,
  ): void {
    req.requestId = randomUUID();
    next();
  }
}
