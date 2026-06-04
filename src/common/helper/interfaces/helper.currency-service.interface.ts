import { ENUM_HELPER_CURRENCY_TYPE } from 'src/common/helper/enums/helper.enum';

export interface IHelperCurrencyService {
    roundPrice(
        number: number,
        currency: ENUM_HELPER_CURRENCY_TYPE,
        locale: string
    ): number;
}
