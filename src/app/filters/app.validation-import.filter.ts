import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import type { IAppException } from 'src/app/interfaces/app.interface';
import { FileImportException } from 'src/common/file/exceptions/file-import.exception';

@Catch(FileImportException)
export class AppValidationImportFilter implements ExceptionFilter {
  catch(exception: FileImportException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();

    const body: IAppException = {
      statusCode: status,
      message: 'file.import',
    };

    response.status(status).json(body);
  }
}
