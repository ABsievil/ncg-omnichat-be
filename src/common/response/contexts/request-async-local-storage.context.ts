import { AsyncLocalStorage } from 'async_hooks';
import { HelperCurrencyService } from 'src/common/helper/services/helper.currency.service';
import { ENUM_MESSAGE_LANGUAGE } from 'src/common/message/enums/message.enum';
import { MessageService } from 'src/common/message/services/message.service';
import { ITimezoneAndLocale } from 'src/common/response/interfaces/response.interface';

export const requestContextStorage = new AsyncLocalStorage<{
    language: ENUM_MESSAGE_LANGUAGE;
    version: string;
    messageService?: MessageService;
    helperCurrencyService?: HelperCurrencyService;
    timezoneAndLocale?: Map<string, ITimezoneAndLocale>;
    branchId?: string;
}>();
