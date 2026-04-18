import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Response } from 'express';
import type { IRequestWithContext } from 'src/common/request/interfaces/request-with-context.interface';

@Injectable()
export class AppRequestIdMiddleware implements NestMiddleware {
  use(
    req: IRequestWithContext,
    _res: Response,
    next: NextFunction,
  ): void {
    req.requestId = randomUUID();
    next();
  }
}
