import { Injectable, Logger } from '@nestjs/common';
import { Connection } from 'mongoose';
import { InjectDatabaseConnection } from 'src/common/database/decorators/database.decorator';

@Injectable()
export class DatabaseIndexService {
    private readonly logger = new Logger(DatabaseIndexService.name);

    constructor(
        @InjectDatabaseConnection()
        private readonly databaseConnection: Connection
    ) {}

    async syncAllIndexes(): Promise<void> {
        const modelNames = this.databaseConnection.modelNames();

        for (const modelName of modelNames) {
            try {
                await this.databaseConnection.model(modelName).syncIndexes();
            } catch (error) {
                this.logger.warn(
                    `Failed to sync indexes for model ${modelName}: ${
                        (error as Error).message
                    }`
                );
            }
        }
    }
}
