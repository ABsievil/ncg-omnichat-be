import { HttpStatus } from '@nestjs/common';
import type { IAppValidationImportErrorParam } from 'src/app/interfaces/app.validation-import.interface';
import { ENUM_REQUEST_STATUS_CODE_ERROR } from 'src/common/request/enums/request.status-code.enum';

export class FileImportException extends Error {
  readonly httpStatus: HttpStatus = HttpStatus.UNPROCESSABLE_ENTITY;
  readonly statusCode: number = ENUM_REQUEST_STATUS_CODE_ERROR.VALIDATION;
  readonly errors: IAppValidationImportErrorParam[];

  constructor(errors: IAppValidationImportErrorParam[]) {
    super('file.error.validationDto');

    this.errors = errors;
  }

  getStatus(): HttpStatus {
    return this.httpStatus;
  }
}
