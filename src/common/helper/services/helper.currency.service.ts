import { Injectable } from '@nestjs/common';
import { ENUM_HELPER_CURRENCY_TYPE } from 'src/common/helper/enums/helper.enum';
import { IHelperCurrencyService } from 'src/common/helper/interfaces/helper.currency-service.interface';

@Injectable()
export class HelperCurrencyService implements IHelperCurrencyService {
    roundPrice(
        number: number,
        currency:
            | ENUM_HELPER_CURRENCY_TYPE
            | string = ENUM_HELPER_CURRENCY_TYPE.VND,
        locale: string = 'vi-VN'
    ): number {
        if (!number) return 0;
        const formatter = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
        });

        const options = formatter.resolvedOptions();
        const fractionDigits = options.maximumFractionDigits;

        return Number(number.toFixed(fractionDigits));
    }

    formatCurrency(
        number: number,
        currency: ENUM_HELPER_CURRENCY_TYPE = ENUM_HELPER_CURRENCY_TYPE.VND,
        locale: string = 'vi-VN'
    ): string {
        return number.toLocaleString(locale, {
            style: 'currency',
            currency: currency,
        });
    }
}
