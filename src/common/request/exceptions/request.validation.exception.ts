import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export class RequestValidationException extends UnprocessableEntityException {
  constructor(public readonly errors: ValidationError[]) {
    super({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'request.validation',
      errors,
    });
  }
}
