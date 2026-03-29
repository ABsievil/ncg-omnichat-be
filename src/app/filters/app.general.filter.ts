import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { IAppException } from 'src/app/interfaces/app.interface';

@Catch()
export class AppGeneralFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppGeneralFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    this.logger.error(exception);

    const body: IAppException = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'http.internalServerError',
    };

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}
