import { Injectable } from '@nestjs/common';
import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: true })
@Injectable()
export class DateLessThanEqualPropertyConstraint
    implements ValidatorConstraintInterface
{
    validate(value: string, args: ValidationArguments): boolean {
        const [property] = args.constraints;
        const relatedValue = args.object[property];
        return value <= relatedValue;
    }
}

export function DateLessThanEqualProperty(
    property: string,
    validationOptions?: ValidationOptions
) {
    return function (object: Record<string, any>, propertyName: string): void {
        registerDecorator({
            name: 'DateGreaterThanEqualProperty',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [property],
            validator: DateLessThanEqualPropertyConstraint,
        });
    };
}

@ValidatorConstraint({ async: true })
@Injectable()
export class DateLessThanPropertyConstraint
    implements ValidatorConstraintInterface
{
    validate(value: string, args: ValidationArguments): boolean {
        const [property] = args.constraints;
        const relatedValue = args.object[property];
        return value < relatedValue;
    }
}

export function DateLessThanProperty(
    property: string,
    validationOptions?: ValidationOptions
) {
    return function (object: Record<string, any>, propertyName: string): void {
        registerDecorator({
            name: 'DateGreaterThanProperty',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [property],
            validator: DateLessThanPropertyConstraint,
        });
    };
}

@ValidatorConstraint({ async: true })
@Injectable()
export class DateEqualPropertyConstraint
    implements ValidatorConstraintInterface
{
    validate(value: string, args: ValidationArguments): boolean {
        const [property] = args.constraints;
        const relatedValue = args.object[property];
        const valueDate = new Date(value);
        const relatedDate = new Date(relatedValue);

        const valueDateOnly = new Date(valueDate);
        const relatedDateOnly = new Date(relatedDate);
        valueDateOnly.setHours(0, 0, 0, 0);
        relatedDateOnly.setHours(0, 0, 0, 0);

        if (valueDateOnly.getTime() !== relatedDateOnly.getTime()) {
            return false;
        }

        return valueDate.getTime() > relatedDate.getTime();
    }
}

export function DateEqualProperty(
    property: string,
    validationOptions?: ValidationOptions
) {
    return function (object: Record<string, any>, propertyName: string): void {
        registerDecorator({
            name: 'DateEqualProperty',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [property],
            validator: DateEqualPropertyConstraint,
        });
    };
}
