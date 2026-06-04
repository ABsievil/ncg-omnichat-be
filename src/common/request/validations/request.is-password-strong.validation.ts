import { Injectable } from '@nestjs/common';
import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { PASSWORD_DEFAULT_MIN_LENGTH } from 'src/common/helper/constants/string.constants';
import { HelperStringService } from 'src/common/helper/services/helper.string.service';
import { REQUEST_MESSAGE_KEY } from 'src/common/request/constants/request-validation.constants';

@ValidatorConstraint({ async: false })
@Injectable()
export class IsPasswordStrongConstraint
    implements ValidatorConstraintInterface
{
    constructor(protected readonly helperStringService: HelperStringService) {}

    validate(value: string): boolean {
        return value
            ? this.helperStringService.checkPasswordStrength(value, {
                  length: PASSWORD_DEFAULT_MIN_LENGTH,
                  requireSpecialChar: true,
              })
            : false;
    }

    defaultMessage(): string {
        return REQUEST_MESSAGE_KEY.PASSWORD_WEAK;
    }
}

export function IsPasswordStrong(validationOptions?: ValidationOptions) {
    return function (object: Record<string, any>, propertyName: string): void {
        registerDecorator({
            name: 'IsPasswordStrong',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsPasswordStrongConstraint,
        });
    };
}
