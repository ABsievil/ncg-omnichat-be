import {
  DynamicModule,
  HttpStatus,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ValidationError } from 'class-validator';
import { RequestValidationException } from 'src/common/request/exceptions/request.validation.exception';
import { RequestTimeoutInterceptor } from 'src/common/request/interceptors/request.timeout.interceptor';

@Module({})
export class RequestModule {
  static forRoot(): DynamicModule {
    return {
      module: RequestModule,
      controllers: [],
      providers: [
        {
          provide: APP_INTERCEPTOR,
          useClass: RequestTimeoutInterceptor,
        },
        {
          provide: APP_PIPE,
          useFactory: () =>
            new ValidationPipe({
              whitelist: true,
              transform: true,
              forbidNonWhitelisted: false,
              skipMissingProperties: false,
              forbidUnknownValues: true,
              transformOptions: {
                enableImplicitConversion: false,
              },
              errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
              exceptionFactory: async (errors: ValidationError[]) =>
                new RequestValidationException(errors),
            }),
        },
      ],
      imports: [],
    };
  }
}
