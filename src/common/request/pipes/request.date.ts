import {
    BadRequestException,
    HttpStatus,
    Inject,
    Injectable,
    mixin,
    PipeTransform,
    Type,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { MessageService } from 'src/common/message/services/message.service';

export function RequestDatePipe(field: string): Type<PipeTransform> {
    @Injectable()
    class MixinRequestDatePipe implements PipeTransform {
        constructor(
            @Inject(REQUEST)
            private readonly request: Request,
            private readonly messageService: MessageService
        ) {}

        async transform(value: string): Promise<Date | any> {
            if (!value) {
                return;
            }

            const regex = /^\d{4}-\d{2}-\d{2}$/;
            if (!regex.test(value)) {
                throw new BadRequestException({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: this.messageService.setMessage(
                        'request.invalidDateFormat',
                        {
                            properties: {
                                property: field,
                                value: value,
                            },
                        }
                    ),
                });
            }

            const date = new Date(value);

            if (isNaN(date.getTime())) {
                throw new BadRequestException({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: this.messageService.setMessage(
                        'request.invalidDateFormat',
                        {
                            properties: {
                                property: field,
                                value: value,
                            },
                        }
                    ),
                });
            }

            return date;
        }
    }
    return mixin(MixinRequestDatePipe);
}
