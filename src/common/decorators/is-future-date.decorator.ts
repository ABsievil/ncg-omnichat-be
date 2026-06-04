import {
    ValidationArguments,
    ValidationOptions,
    registerDecorator,
} from 'class-validator';

export function IsFutureDate(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isFutureDate',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    if (!value) return true;
                    const now = new Date();
                    const date = new Date(value);
                    return date.getTime() >= now.getTime();
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} must not be earlier than the current time`;
                },
            },
        });
    };
}
