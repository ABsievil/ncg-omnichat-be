import { DynamicModule, Global, Module } from '@nestjs/common';
import { FileService } from 'src/common/file/services/file.service';
import { FirebaseStorageService } from 'src/common/file/services/firebase-storage.service';
import { R2Service } from 'src/common/file/services/r2.service';

@Global()
@Module({})
export class FileModule {
    static forRoot(): DynamicModule {
        return {
            module: FileModule,
            providers: [FileService, FirebaseStorageService, R2Service],
            exports: [FileService, FirebaseStorageService, R2Service],
            imports: [],
            controllers: [],
        };
    }
}
