import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppGeneralFilter } from 'src/app/filters/app.general.filter';
import { AppHttpFilter } from 'src/app/filters/app.http.filter';
import { AppValidationFilter } from 'src/app/filters/app.validation.filter';
import { AppValidationImportFilter } from 'src/app/filters/app.validation-import.filter';
import {
  AppJsonBodyParserMiddleware,
  AppUrlencodedBodyParserMiddleware,
} from 'src/app/middlewares/app.body-parser.middleware';
import { AppCorsMiddleware } from 'src/app/middlewares/app.cors.middleware';
import { AppCustomLanguageMiddleware } from 'src/app/middlewares/app.custom-language.middleware';
import { AppHelmetMiddleware } from 'src/app/middlewares/app.helmet.middleware';
import { AppRequestIdMiddleware } from 'src/app/middlewares/app.request-id.middleware';
import { AppResponseTimeMiddleware } from 'src/app/middlewares/app.response-time.middleware';
import { AppUrlVersionMiddleware } from 'src/app/middlewares/app.url-version.middleware';

@Module({
  providers: [
    { provide: APP_FILTER, useClass: AppGeneralFilter },
    { provide: APP_FILTER, useClass: AppValidationFilter },
    { provide: APP_FILTER, useClass: AppValidationImportFilter },
    { provide: APP_FILTER, useClass: AppHttpFilter },
    AppRequestIdMiddleware,
    AppResponseTimeMiddleware,
    AppCorsMiddleware,
    AppHelmetMiddleware,
    AppJsonBodyParserMiddleware,
    AppUrlencodedBodyParserMiddleware,
    AppUrlVersionMiddleware,
    AppCustomLanguageMiddleware,
  ],
})
export class AppMiddlewareModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(
        AppRequestIdMiddleware,
        AppResponseTimeMiddleware,
        AppCorsMiddleware,
        AppHelmetMiddleware,
        AppUrlVersionMiddleware,
        AppCustomLanguageMiddleware,
        AppJsonBodyParserMiddleware,
        AppUrlencodedBodyParserMiddleware,
      )
      .forRoutes('*');
  }
}
