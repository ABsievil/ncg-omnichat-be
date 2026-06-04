import { Injectable } from '@nestjs/common';
import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { HelperStringService } from 'src/common/helper/services/helper.string.service';
import { REQUEST_MESSAGE_KEY } from 'src/common/request/constants/request-validation.constants';

@ValidatorConstraint({ async: false })
@Injectable()
export class IsNotDisposableEmailConstraint
    implements ValidatorConstraintInterface
{
    constructor(protected readonly helperStringService: HelperStringService) {}

    validate(value: string): boolean {
        if (!value) return true;
        return !this.helperStringService.checkDisposableEmail(value);
    }

    defaultMessage(): string {
        return REQUEST_MESSAGE_KEY.EMAIL_DISPOSABLE;
    }
}

export function IsNotDisposableEmail(validationOptions?: ValidationOptions) {
    return function (object: Record<string, any>, propertyName: string): void {
        registerDecorator({
            name: 'IsNotDisposableEmail',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsNotDisposableEmailConstraint,
        });
    };
}
