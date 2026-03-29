import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppGeneralFilter } from 'src/app/filters/app.general.filter';
import { AppHttpFilter } from 'src/app/filters/app.http.filter';
import { AppValidationFilter } from 'src/app/filters/app.validation.filter';
import { AppValidationImportFilter } from 'src/app/filters/app.validation-import.filter';

@Module({
  providers: [
    { provide: APP_FILTER, useClass: AppGeneralFilter },
    { provide: APP_FILTER, useClass: AppValidationFilter },
    { provide: APP_FILTER, useClass: AppValidationImportFilter },
    { provide: APP_FILTER, useClass: AppHttpFilter },
  ],
})
export class AppMiddlewareModule {}
