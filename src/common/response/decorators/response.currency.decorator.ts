import { Transform } from 'class-transformer';
import { HelperCurrencyService } from 'src/common/helper/services/helper.currency.service';
import { requestContextStorage } from 'src/common/response/contexts/request-async-local-storage.context';

export function TransformCurrency() {
    return Transform(({ value }: { value: number }) => {
        const context = requestContextStorage.getStore();
        const helperCurrencyService = context?.helperCurrencyService;

        try {
            const valueFormatted =
                value &&
                !isNaN(Number(value)) &&
                helperCurrencyService
                    ? helperCurrencyService.roundPrice(value)
                    : 0;

            return valueFormatted;
        } catch {
            return 0;
        }
    });
}
