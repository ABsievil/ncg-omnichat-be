import { Injectable } from '@nestjs/common';
import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { Connection } from 'mongoose';
import { InjectDatabaseConnection } from 'src/common/database/decorators/database.decorator';

@ValidatorConstraint({ name: 'existsDB', async: true })
@Injectable()
export class IsExistsConstraint implements ValidatorConstraintInterface {
    constructor(
        @InjectDatabaseConnection()
        private readonly databaseConnection: Connection
    ) {}

    async validate(value: string, args: ValidationArguments): Promise<boolean> {
        if (!value) return false;

        const [
            entityName,
            fieldName,
            optional = false,
            find = {},
            findMapping = [],
            deleted = false,
        ] = args.constraints;

        if (optional === true && (value === undefined || value === null)) {
            return true;
        }

        const searchConditions: any = {
            [fieldName]: value,
            deleted,
            ...find,
        };

        if (findMapping.length > 0) {
            for (const key of findMapping) {
                if (args.object[key]) {
                    searchConditions[key] = args.object[key];
                }
            }
        }

        try {
            const count =
                await this.databaseConnection.models[entityName].countDocuments(
                    searchConditions
                );
            return count > 0;
        } catch {
            return false;
        }
    }

    defaultMessage(args: ValidationArguments): string {
        const [modelName] = args.constraints;
        return `${args.property} with ID "${args.value}" doesn't exist in ${modelName} collection`;
    }
}

export function ExistsDB(
    entityName: string,
    fieldName: string,
    validationOptions?: ValidationOptions,
    find: Record<string, any> = {},
    findMapping: string[] = [],
    optional: boolean = false
) {
    return function (object: Record<string, any>, propertyName: string): void {
        registerDecorator({
            name: 'existsDB',
            target: object.constructor,
            propertyName,
            options: {
                message: `${propertyName}`,
                ...validationOptions,
            },
            constraints: [entityName, fieldName, optional, find, findMapping],
            validator: IsExistsConstraint,
        });
    };
}
