import { DynamicModule } from '@nestjs/common';

export class EncryptionModule {
    static forRoot(): DynamicModule {
        return {
            module: EncryptionModule,
            providers: [],
            exports: [],
            imports: [],
            controllers: [],
        };
    }
}
