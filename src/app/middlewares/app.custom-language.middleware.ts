import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Response } from 'express';
import { MESSAGE_CONFIG_PATH } from 'src/common/request/constants/middleware-config-path.constant';
import type { IRequestWithContext } from 'src/common/request/interfaces/request-with-context.interface';
import { ERROR_RESPONSE_DEFAULT } from 'src/common/response/constants/error-response.constant';
import { ErrorResponseHeader } from 'src/common/response/enums/error-response.enum';

@Injectable()
export class AppCustomLanguageMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(
    req: IRequestWithContext,
    res: Response,
    next: NextFunction,
  ): void {
    const defaultLanguage =
      this.configService.get<string>(MESSAGE_CONFIG_PATH.DEFAULT_LANGUAGE) ??
      ERROR_RESPONSE_DEFAULT.LANGUAGE;

    const available =
      this.configService.get<string[]>(
        MESSAGE_CONFIG_PATH.AVAILABLE_LANGUAGES,
      ) ?? [ERROR_RESPONSE_DEFAULT.LANGUAGE];

    const headerLang = req.get(ErrorResponseHeader.Language);
    const language =
      headerLang && available.includes(headerLang)
        ? headerLang
        : defaultLanguage;

    req.__language = language;
    res.setHeader(ErrorResponseHeader.Language, language);
    next();
  }
}
