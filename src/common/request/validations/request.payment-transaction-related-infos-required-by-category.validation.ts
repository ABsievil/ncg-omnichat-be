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
import { PaymentTransactionRelatedInfoLike } from 'src/common/request/types/request.payment-transaction-related-info-like.type';
import { PaymentCategoryEntity } from 'src/modules/payment-category/repository/entities/payment-category.entity';
import { ENUM_PAYMENT_TRANSACTION_RELATED_INFO_TYPE } from 'src/modules/payment-transaction/enums/payment-transaction.enum';

@ValidatorConstraint({
    name: 'paymentTransactionRelatedInfosRequiredByCategory',
    async: true,
})
@Injectable()
export class PaymentTransactionRelatedInfosRequiredByCategoryConstraint
    implements ValidatorConstraintInterface
{
    constructor(
        @InjectDatabaseConnection()
        private readonly databaseConnection: Connection
    ) {}

    async validate(value: string, args: ValidationArguments): Promise<boolean> {
        const categoryId = value;
        const object = args.object as Record<string, any>;
        const relatedInfos: PaymentTransactionRelatedInfoLike[] | undefined =
            object?.relatedInfos;

        const { found, requiredTypes } =
            await this.getRequiredRelatedTypes(categoryId);

        if (!found) {
            object.__missingPaymentTransactionRequiredRelatedTypes = [];
            object.__paymentTransactionCategoryNotFound = true;
            return false;
        }

        // Category không có relatedTypes required => không bắt buộc relatedInfos
        if (!requiredTypes.length) {
            return true;
        }

        if (!Array.isArray(relatedInfos) || relatedInfos.length === 0) {
            object.__missingPaymentTransactionRequiredRelatedTypes =
                requiredTypes;
            return false;
        }

        const missing = requiredTypes.filter(requiredType => {
            return !relatedInfos.some(
                (info: PaymentTransactionRelatedInfoLike) =>
                    info?.type === requiredType &&
                    typeof info?.id === 'string' &&
                    info.id.trim().length > 0
            );
        });

        if (missing.length > 0) {
            object.__missingPaymentTransactionRequiredRelatedTypes = missing;
            object.__paymentTransactionCategoryNotFound = false;
            return false;
        }

        return true;
    }

    defaultMessage(args: ValidationArguments): string {
        const object = args.object as Record<string, any>;
        if (object.__paymentTransactionCategoryNotFound) {
            return `categoryId with ID "${args.value}" doesn't exist in PaymentCategories collection`;
        }
        const missing: ENUM_PAYMENT_TRANSACTION_RELATED_INFO_TYPE[] =
            object.__missingPaymentTransactionRequiredRelatedTypes ?? [];

        if (missing.length > 0) {
            return `relatedInfos must include required related types: ${missing.join(', ')}`;
        }

        return 'relatedInfos is invalid for selected category';
    }

    private async getRequiredRelatedTypes(categoryId: string): Promise<{
        found: boolean;
        requiredTypes: ENUM_PAYMENT_TRANSACTION_RELATED_INFO_TYPE[];
    }> {
        if (!categoryId) {
            return { found: false, requiredTypes: [] };
        }

        const model =
            this.databaseConnection.models[PaymentCategoryEntity.name];
        if (!model) {
            return { found: false, requiredTypes: [] };
        }

        const category: any = await model
            .findOne({
                _id: categoryId,
                deleted: false,
            })
            .lean();

        if (!category) {
            return { found: false, requiredTypes: [] };
        }

        const relatedTypes = (category?.relatedTypes ?? []) as {
            type: ENUM_PAYMENT_TRANSACTION_RELATED_INFO_TYPE;
            required: boolean;
        }[];

        return {
            found: true,
            requiredTypes: relatedTypes
                .filter(t => t?.required)
                .map(t => t.type),
        };
    }
}

export function PaymentTransactionRelatedInfosRequiredByCategory(
    validationOptions?: ValidationOptions
) {
    return function (object: Record<string, any>, propertyName: string): void {
        registerDecorator({
            name: 'paymentTransactionRelatedInfosRequiredByCategory',
            target: object.constructor,
            propertyName,
            options: {
                ...validationOptions,
                message:
                    validationOptions?.message ??
                    'paymentTransactionRelatedInfosRequiredByCategory',
            },
            constraints: [],
            validator:
                PaymentTransactionRelatedInfosRequiredByCategoryConstraint,
        });
    };
}
