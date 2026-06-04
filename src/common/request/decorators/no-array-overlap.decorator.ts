import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
} from 'class-validator';

/**
 * @example
 * @NoArrayOverlap('leaderIds')
 * employeeIds: string[];
 *
 * @example
 * @NoArrayOverlap(['employeeIds', 'otherIds'])
 * leaderIds: string[];
 */
export function NoArrayOverlap(
    properties: string | string[],
    validationOptions?: ValidationOptions
) {
    return function (object: object, propertyName: string) {
        const propertyArray = Array.isArray(properties)
            ? properties
            : [properties];

        registerDecorator({
            name: 'noArrayOverlap',
            target: object.constructor,
            propertyName: propertyName,
            constraints: propertyArray,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const relatedPropertyNames = args.constraints;

                    if (!Array.isArray(value)) {
                        return true;
                    }

                    for (const relatedPropertyName of relatedPropertyNames) {
                        const relatedValue = (args.object as any)[
                            relatedPropertyName
                        ];

                        if (!Array.isArray(relatedValue)) {
                            continue;
                        }

                        const overlappingValues = value.filter(item =>
                            relatedValue.includes(item)
                        );

                        if (overlappingValues.length > 0) {
                            return false;
                        }
                    }

                    return true;
                },
                defaultMessage(args: ValidationArguments) {
                    const relatedPropertyNames = args.constraints;
                    const propertyList = relatedPropertyNames.join(', ');
                    return `${args.property} cannot have overlapping values with ${propertyList}`;
                },
            },
        });
    };
}
