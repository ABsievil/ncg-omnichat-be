import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
} from 'class-validator';

/**
 * @description Validate array elements là duy nhất theo field cho trước (default: `type`).
 * Example:
 * - relatedInfos: [{ type: CONTRACT, id: '...' }, ...]
 * - relatedTypes: [{ type: CONTRACT, required: true }, ...]
 */
export function NoDuplicateTypeInArray(
    typeField: string = 'type',
    validationOptions?: ValidationOptions
) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'noDuplicateTypeInArray',
            target: object.constructor,
            propertyName,
            constraints: [typeField],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [fieldName] = args.constraints as [string];

                    if (!Array.isArray(value)) {
                        return true;
                    }

                    const types = value
                        .map((item: any) => item?.[fieldName])
                        .filter((t: any) => t !== undefined && t !== null);

                    const uniqueCount = new Set(types).size;
                    return uniqueCount === types.length;
                },
                defaultMessage(args: ValidationArguments) {
                    const [fieldName] = args.constraints as [string];
                    return this.translateService.translate(
                        'request.noDuplicateTypeInArray',
                        {
                            property: args.property,
                            typeField: fieldName,
                        }
                    );
                },
            },
        });
    };
}
