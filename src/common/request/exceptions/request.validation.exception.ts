import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { ExceptionMessagePath } from 'src/common/response/enums/exception-message-path.enum';

export class RequestValidationException extends UnprocessableEntityException {
  constructor(public readonly errors: ValidationError[]) {
    super({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: ExceptionMessagePath.RequestValidation,
      errors,
    });
  }
}
