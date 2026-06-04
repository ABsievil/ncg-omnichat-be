import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { Observable } from 'rxjs';
import { InjectDatabaseConnection } from 'src/common/database/decorators/database.decorator';
import { HelperCurrencyService } from 'src/common/helper/services/helper.currency.service';
import { ENUM_MESSAGE_LANGUAGE } from 'src/common/message/enums/message.enum';
import { MessageService } from 'src/common/message/services/message.service';
import { REDIS_KEY_BRANCH_PREFIX } from 'src/common/redis/constants/redis.constant';
import { RedisService } from 'src/common/redis/services/redis.service';
import {
    REQUEST_CURRENCY_NAME,
    REQUEST_CURRENCY_SYMBOL,
    REQUEST_LOCALE,
    REQUEST_UTC,
} from 'src/common/request/constants/request.constant';
import { IRequestApp } from 'src/common/request/interfaces/request.interface';

import { requestContextStorage } from 'src/common/response/contexts/request-async-local-storage.context';
import { ShopBranchEntity } from 'src/modules/shop-branch/repository/entities/shop-branch.entity';

/**
 * @description Interceptor để gắn AsyncLocalStorage context
 */
@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
    constructor(
        private readonly configService: ConfigService,
        private readonly messageService: MessageService,
        private readonly helperCurrencyService: HelperCurrencyService,
        private readonly redisService: RedisService,
        @InjectDatabaseConnection()
        private readonly databaseConnection: Connection
    ) {}

    private mapBranchesToTimezoneAndLocale(branches: any[]): Map<string, any> {
        const timezoneMap = new Map<string, any>();

        if (!branches?.length) return timezoneMap;

        branches.forEach(branch => {
            const branchId = branch?.id || branch?.fbId;
            if (branchId) {
                timezoneMap.set(branchId, {
                    id: branchId,
                    utc: branch?.utc || REQUEST_UTC,
                    locale: branch?.locale?.locale || REQUEST_LOCALE,
                    currencyName:
                        branch?.locale?.currencyName || REQUEST_CURRENCY_NAME,
                    currencySymbol:
                        branch?.locale?.currencySymbol ||
                        REQUEST_CURRENCY_SYMBOL,
                });
            }
        });

        return timezoneMap;
    }

    async intercept(
        context: ExecutionContext,
        next: CallHandler
    ): Promise<Observable<any>> {
        if (context.getType() === 'http') {
            const request: IRequestApp = context
                .switchToHttp()
                .getRequest<IRequestApp>();

            const language =
                request.__language ||
                this.configService.get<ENUM_MESSAGE_LANGUAGE>(
                    'message.language'
                ) ||
                ENUM_MESSAGE_LANGUAGE.VI;

            const branchIds = request?.user?.branches || [];
            const branchKeys = branchIds.map(
                (id: string) => `${REDIS_KEY_BRANCH_PREFIX}${id}`
            );
            let branches = await this.redisService.getMany(branchKeys);

            if (!branches.length) {
                branches = await this.databaseConnection
                    .model(ShopBranchEntity.name)
                    .find({
                        fbId: { $in: branchIds },
                    })
                    .lean()
                    .exec();
            }

            const timezoneAndLocale =
                this.mapBranchesToTimezoneAndLocale(branches);

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
                    }
                );
            });
        }

        return next.handle();
    }
}
