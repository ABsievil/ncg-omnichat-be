import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Response } from 'express';
import type { IRequestApp } from 'src/common/request/interfaces/request.interface';
import { ERROR_RESPONSE_DEFAULT } from 'src/common/response/constants/error-response.constant';
import { ErrorResponseHeader } from 'src/common/response/enums/error-response.enum';

@Injectable()
export class AppCustomLanguageMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(
    req: IRequestApp,
    res: Response,
    next: NextFunction,
  ): void {
    const defaultLanguage =
      this.configService.get<string>('message.defaultLanguage') ??
      ERROR_RESPONSE_DEFAULT.LANGUAGE;

    const available =
      this.configService.get<string[]>('message.availableLanguages') ?? [
        ERROR_RESPONSE_DEFAULT.LANGUAGE,
      ];

    const headerLang = req.get(ErrorResponseHeader.Language);
    const acceptLang = req
      .get('accept-language')
      ?.split(',')[0]
      ?.trim()
      .split('-')[0]
      ?.toLowerCase();
    const requested =
      (headerLang && available.includes(headerLang) && headerLang) ||
      (acceptLang && available.includes(acceptLang) && acceptLang) ||
      defaultLanguage;
    const language = requested;

    req.__language = language;
    res.setHeader(ErrorResponseHeader.Language, language);
    next();
  }
}
