import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { ExceptionMessagePath } from 'src/common/response/enums/exception-message-path.enum';

export class FileImportException extends UnprocessableEntityException {
  constructor(public readonly errors: Record<string, unknown>[]) {
    super({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: ExceptionMessagePath.FileImport,
      errors,
    });
  }
}
