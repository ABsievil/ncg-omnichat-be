import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FcmService } from 'src/common/fcm/services/fcm.service';

@Global()
@Module({})
export class FcmModule {
    static forRoot(): DynamicModule {
        return {
            module: FcmModule,
            providers: [FcmService],
            exports: [FcmService],
            imports: [ConfigModule],
            controllers: [],
        };
    }
}
