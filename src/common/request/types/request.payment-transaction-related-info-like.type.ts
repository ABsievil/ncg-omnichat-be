import {
    ENUM_PAYMENT_TRANSACTION_RELATED_INFO_TYPE,
} from 'src/modules/payment-transaction/enums/payment-transaction.enum';

export type PaymentTransactionRelatedInfoLike = {
    type?: ENUM_PAYMENT_TRANSACTION_RELATED_INFO_TYPE;
    id?: string;
};

