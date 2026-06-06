import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { ENUM_MESSAGE_LANGUAGE } from 'src/common/message/enums/message.enum';
import { MessageService } from 'src/common/message/services/message.service';
import {
    REQUEST_CURRENCY_NAME,
    REQUEST_CURRENCY_SYMBOL,
    REQUEST_LOCALE,
    REQUEST_UTC,
} from 'src/common/request/constants/request.constant';
import { IRequestApp } from 'src/common/request/interfaces/request.interface';
import { HelperCurrencyService } from 'src/common/helper/services/helper.currency.service';
import { requestContextStorage } from 'src/common/response/contexts/request-async-local-storage.context';

/**
 * Gắn AsyncLocalStorage context (ngôn ngữ, locale mặc định) cho response decorators.
 */
@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
    constructor(
        private readonly configService: ConfigService,
        private readonly messageService: MessageService,
        private readonly helperCurrencyService: HelperCurrencyService,
    ) {}

    async intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Promise<Observable<unknown>> {
        if (context.getType() !== 'http') {
            return next.handle();
        }

        const request = context.switchToHttp().getRequest<IRequestApp>();

        const language =
            request.__language ??
            this.configService.get<ENUM_MESSAGE_LANGUAGE>(
                'message.defaultLanguage',
            ) ??
            ENUM_MESSAGE_LANGUAGE.EN;

        const timezoneAndLocale = new Map([
            [
                'default',
                {
                    id: 'default',
                    utc: String(REQUEST_UTC),
                    locale: REQUEST_LOCALE,
                    currencyName: REQUEST_CURRENCY_NAME,
                    currencySymbol: REQUEST_CURRENCY_SYMBOL,
                },
            ],
        ]);

        return new Observable(subscriber => {
            requestContextStorage.run(
                {
                    language: language as ENUM_MESSAGE_LANGUAGE,
                    version: request.__version,
                    messageService: this.messageService,
                    helperCurrencyService: this.helperCurrencyService,
                    timezoneAndLocale,
                },
                () => {
                    next.handle().subscribe({
                        next: value => subscriber.next(value),
                        error: error => subscriber.error(error),
                        complete: () => subscriber.complete(),
                    });
                },
            );
        });
    }
}
