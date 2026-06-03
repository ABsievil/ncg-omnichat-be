import { DynamicModule, Global, Module } from '@nestjs/common';
import { IsExistsConstraint } from 'src/common/database/decorators/validations/database.exists.validation';
import { DatabaseIndexService } from 'src/common/database/services/database.index.service';
import { DatabaseOptionService } from 'src/common/database/services/database.options.service';
import { DatabaseService } from 'src/common/database/services/database.service';
import { DATABASE_CORE_PROVIDERS, DATABASE_OPTION_PROVIDERS } from './constants/database.constant';

@Module({
    providers: DATABASE_OPTION_PROVIDERS,
    exports: DATABASE_OPTION_PROVIDERS,
    imports: [],
    controllers: [],
})
export class DatabaseOptionModule {}

@Global()
@Module({})
export class DatabaseModule {
    static forRoot(): DynamicModule {
        return {
            module: DatabaseModule,
            providers: DATABASE_CORE_PROVIDERS,
            exports: [DatabaseService, IsExistsConstraint, DatabaseIndexService],
            imports: [],
            controllers: [],
        };
    }
}
