import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { IAppException } from 'src/app/interfaces/app.interface';
import { RequestValidationException } from 'src/common/request/exceptions/request.validation.exception';

@Catch(RequestValidationException)
export class AppValidationFilter implements ExceptionFilter {
  catch(exception: RequestValidationException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const body: IAppException = {
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'request.validation',
      errors: exception.errors,
    };

    response.status(HttpStatus.UNPROCESSABLE_ENTITY).json(body);
  }
}
