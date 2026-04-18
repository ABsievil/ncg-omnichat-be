import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { ExceptionMessagePath } from 'src/common/response/enums/exception-message-path.enum';
import type { IAppException } from 'src/app/interfaces/app.interface';
import type { IRequestWithContext } from 'src/common/request/interfaces/request-with-context.interface';
import { FileImportException } from 'src/common/file/exceptions/file-import.exception';
import { ErrorResponseService } from 'src/common/response/services/error-response.service';

@Catch(FileImportException)
export class AppValidationImportFilter implements ExceptionFilter {
  constructor(private readonly errorResponse: ErrorResponseService) {}

  catch(exception: FileImportException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<IRequestWithContext>();

    const metadata = this.errorResponse.buildMetadata(request);
    const status = exception.getStatus();

    const body: IAppException = {
      statusCode: status,
      message: ExceptionMessagePath.FileImport,
      errors: exception.errors,
      _metadata: metadata,
    };

    this.errorResponse.applyHeaders(response, metadata);
    response.status(status).json(body);
  }
}
