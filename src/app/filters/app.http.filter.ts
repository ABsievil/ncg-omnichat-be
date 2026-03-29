import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { IAppException } from 'src/app/interfaces/app.interface';

@Catch(HttpException)
export class AppHttpFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const isObject =
      typeof exceptionResponse === 'object' && exceptionResponse !== null;
    const raw = isObject
      ? (exceptionResponse as Record<string, unknown>)
      : {};

    const body: IAppException = {
      statusCode: (raw['statusCode'] as number) ?? status,
      message: (raw['message'] as string) ?? exception.message,
      ...(raw['errorCode'] !== undefined && {
        errorCode: raw['errorCode'] as number,
      }),
      ...(raw['data'] !== undefined && {
        data: raw['data'] as Record<string, unknown>,
      }),
    };

    response.status(status).json(body);
  }
}
