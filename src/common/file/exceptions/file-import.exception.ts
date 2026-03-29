import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';

export class FileImportException extends UnprocessableEntityException {
  constructor(public readonly errors: Record<string, unknown>[]) {
    super({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'file.import',
      errors,
    });
  }
}
