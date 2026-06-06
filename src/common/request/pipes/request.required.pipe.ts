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
import { MessageService } from 'src/common/message/services/message.service';

export function RequestRequiredPipe(field: string): Type<PipeTransform> {
    @Injectable()
    class MixinRequestRequiredPipe implements PipeTransform {
        constructor(
            @Inject(REQUEST)
            private readonly request: any,
            private readonly messageService: MessageService
        ) {}

        async transform(value: string): Promise<string | any> {
            if (!value) {
                throw new NotFoundException({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: this.messageService.setMessage(
                        'request.required',
                        {
                            properties: { property: field },
                        }
                    ),
                });
            }

            return value;
        }
    }
    return mixin(MixinRequestRequiredPipe);
}
