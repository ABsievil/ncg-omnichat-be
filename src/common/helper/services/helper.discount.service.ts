import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { DISCOUNT_DEFAULT_MESSAGES } from 'src/common/helper/constants/discount.constants';
import { ENUM_HELPER_LINE_DISCOUNT_TYPE } from 'src/common/helper/enums/helper.enum';
import {
    IHelperDiscountService,
    IHelperDiscountServiceOptions,
} from 'src/common/helper/interfaces/helper.discount-service.interface';

@Injectable()
export class HelperDiscountService implements IHelperDiscountService {
    calculateLineDiscount(
        discountType: number | string | undefined,
        discountValue: number | undefined,
        subTotal: number,
        options?: IHelperDiscountServiceOptions
    ): number {
        const value = discountValue ?? 0;
        const hasDiscountType =
            discountType !== undefined && discountType !== null;
        const msg = {
            ...DISCOUNT_DEFAULT_MESSAGES,
            ...options?.messages,
        };

        if (value > 0 && !hasDiscountType) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: msg.discountTypeRequired,
            });
        }

        if (!hasDiscountType || value <= 0) {
            return 0;
        }

        const isPercentType =
            discountType === ENUM_HELPER_LINE_DISCOUNT_TYPE.PERCENTAGE ||
            discountType === 0;

        if (isPercentType) {
            if (value > 100) {
                throw new BadRequestException({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: msg.discountValueExceeded,
                });
            }
            return Math.min((subTotal * value) / 100, subTotal);
        }

        const isAmountType =
            discountType === ENUM_HELPER_LINE_DISCOUNT_TYPE.AMOUNT ||
            discountType === 1;

        if (isAmountType) {
            return Math.min(value, subTotal);
        }

        throw new BadRequestException({
            statusCode: HttpStatus.BAD_REQUEST,
            message: msg.invalidDiscountType,
        });
    }
}
