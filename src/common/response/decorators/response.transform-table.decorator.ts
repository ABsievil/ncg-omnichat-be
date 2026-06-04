import { Transform } from 'class-transformer';
import { DateTime } from 'luxon';
import { ENUM_MESSAGE_LANGUAGE } from 'src/common/message/enums/message.enum';
import { MessageService } from 'src/common/message/services/message.service';
import { requestContextStorage } from 'src/common/response/contexts/request-async-local-storage.context';

export function TransformTable(
    isCurrency?: boolean,
    enumMap?: Record<string, string>,
    isTranslateString?: boolean
) {
    return Transform(({ value }: { value: any }) => {
        if (value === null || value === undefined) return '-';
        const context = requestContextStorage.getStore();
        const language = context?.language || ENUM_MESSAGE_LANGUAGE.VI;
        const messageService: MessageService = context?.messageService;

        try {
            switch (typeof value) {
                case 'string':
                    if (!value) return '-';
                    if (enumMap) {
                        return (
                            messageService.setMessage(enumMap[value], {
                                customLanguage: language,
                            }) || value
                        );
                    }
                    if (isTranslateString) {
                        return messageService.setMessage(value, {
                            customLanguage: language,
                        });
                    }

                    return value;
                case 'number':
                    if (enumMap) {
                        return (
                            messageService.setMessage(enumMap[value], {
                                customLanguage: language,
                            }) || value
                        );
                    }
                    if (isCurrency) {
                        return value.toLocaleString('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                        });
                        // switch (language) {
                        //     case ENUM_MESSAGE_LANGUAGE.VI:
                        //         return value.toLocaleString('vi-VN', {
                        //             style: 'currency',
                        //             currency: 'VND',
                        //         });

                        //     case ENUM_MESSAGE_LANGUAGE.EN:
                        //         return value.toLocaleString('en-US', {
                        //             style: 'currency',
                        //             currency: 'USD',
                        //         });
                        //     default:
                        //         return value;
                        // }
                    }
                    if (!value) value = '0';
                    return value;
                case 'object':
                    if (value instanceof Date) {
                        switch (language) {
                            case ENUM_MESSAGE_LANGUAGE.VI:
                                return DateTime.fromJSDate(value).toFormat(
                                    'HH:mm dd-MM-yyyy'
                                );
                            case ENUM_MESSAGE_LANGUAGE.EN:
                                return DateTime.fromJSDate(value)
                                    .setLocale('en-US')
                                    .toLocaleString(DateTime.DATETIME_SHORT);

                            default:
                                return value;
                        }
                    }
                    return value;
                // TODO: Tương lai xử lý thêm type khác
                default:
                    return value;
            }
        } catch {
            return value;
        }
    });
}
