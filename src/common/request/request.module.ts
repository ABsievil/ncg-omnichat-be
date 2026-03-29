import { HttpStatus, Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { RequestValidationException } from 'src/common/request/exceptions/request.validation.exception';

@Module({
  providers: [
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
          exceptionFactory: (errors) => new RequestValidationException(errors),
        }),
    },
  ],
})
export class RequestModule {}
