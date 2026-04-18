import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ExceptionMessagePath } from 'src/common/response/enums/exception-message-path.enum';
import type { IAppException } from 'src/app/interfaces/app.interface';
import { ErrorResponseService } from 'src/common/response/services/error-response.service';

@Catch()
export class AppGeneralFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppGeneralFilter.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly errorResponse: ErrorResponseService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    this.logger.error(exception);

    if (exception instanceof HttpException) {
      httpAdapter.reply(res, exception.getResponse(), exception.getStatus());
      return;
    }

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const metadata = this.errorResponse.buildMetadata(req);
    const body: IAppException = {
      statusCode: status,
      message: ExceptionMessagePath.HttpInternalServerError,
      _metadata: metadata,
    };

    this.errorResponse.applyHeaders(res, metadata);
    res.status(status).json(body);
  }
}
