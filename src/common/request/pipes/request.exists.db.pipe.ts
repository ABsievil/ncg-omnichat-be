import {
    HttpStatus,
    Inject,
    Injectable,
    mixin,
    NotFoundException,
    PipeTransform,
    Type,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Connection } from 'mongoose';
import { InjectDatabaseConnection } from 'src/common/database/decorators/database.decorator';
import { MessageService } from 'src/common/message/services/message.service';

export function ExistsDBPipe(
    entityName: string,
    fieldName: string = '_id',
    isFullValue: boolean = false,
    isBranch: boolean = false,
    deleted: boolean = false,
    optional: boolean = false
): Type<PipeTransform> {
    @Injectable()
    class MixinExistsDBPipe implements PipeTransform {
        constructor(
            @InjectDatabaseConnection()
            private readonly databaseConnection: Connection,
            private readonly messageService: MessageService,
            @Inject(REQUEST) private readonly request: Request
        ) {}

        async transform(value: string): Promise<string | any> {
            if (optional === true && (value === undefined || value === null)) {
                return value;
            }
            if (!value) {
                throw new NotFoundException({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: this.messageService.setMessage('http.404'),
                });
            }

            const searchConditions: any = {
                [fieldName]: value,
                deleted,
            };

            if (isBranch) {
                const branchId =
                    this.request.body?.branchId || this.request.query?.branchId;
                if (branchId) {
                    searchConditions.branchId = branchId;
                }
            }

            const exist =
                await this.databaseConnection.models[entityName].findOne(
                    searchConditions
                );

            if (!exist) {
                throw new NotFoundException({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: this.messageService.setMessage('http.404'),
                });
            }
            return isFullValue ? exist : value;
        }
    }
    return mixin(MixinExistsDBPipe);
}
