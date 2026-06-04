export interface IHelperDiscountServiceMessages {
    discountTypeRequired?: string;
    discountValueExceeded?: string;
    invalidDiscountType?: string;
}

export interface IHelperDiscountServiceOptions {
    messages?: IHelperDiscountServiceMessages;
}

export interface IHelperDiscountService {
    /**
     * @description Calculate line discount from subTotal
     */
    calculateLineDiscount(
        discountType: number | string | undefined,
        discountValue: number | undefined,
        subTotal: number,
        options?: IHelperDiscountServiceOptions
    ): number;
}
