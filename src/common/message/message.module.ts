import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HeaderResolver, I18nJsonLoader, I18nModule } from 'nestjs-i18n';
import * as path from 'path';
import { ENUM_MESSAGE_LANGUAGE } from 'src/common/message/enums/message.enum';
import { MessageService } from 'src/common/message/services/message.service';

@Global()
@Module({})
export class MessageModule {
    static forRoot(): DynamicModule {
        return {
            module: MessageModule,
            providers: [MessageService],
            exports: [MessageService],
            imports: [
                I18nModule.forRootAsync({
                    loader: I18nJsonLoader,
                    inject: [ConfigService],
                    resolvers: [new HeaderResolver(['x-custom-lang'])],
                    useFactory: (configService: ConfigService) => {
                        const availableLanguages =
                            configService.get<string[]>(
                                'message.availableLanguages',
                            ) ?? [ENUM_MESSAGE_LANGUAGE.EN];

                        return {
                            fallbackLanguage:
                                configService.get<string>(
                                    'message.defaultLanguage',
                                ) ?? ENUM_MESSAGE_LANGUAGE.EN,
                            fallbacks: Object.values(
                                ENUM_MESSAGE_LANGUAGE,
                            ).reduce(
                                (acc, lang) => ({
                                    ...acc,
                                    [`${lang}-*`]: lang,
                                }),
                                {} as Record<string, string>,
                            ),
                            loaderOptions: {
                                path: path.join(process.cwd(), 'src/languages'),
                                watch: true,
                            },
                        };
                    },
                }),
            ],
            controllers: [],
        };
    }
}
