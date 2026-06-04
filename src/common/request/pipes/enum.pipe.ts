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

export function RequestEnumPipe(
    field: string,
    enumType: object | any[]
): Type<PipeTransform> {
    @Injectable()
    class MixinRequestEnumPipe implements PipeTransform {
        constructor(
            @Inject(REQUEST)
            private readonly request: Request,
            private readonly messageService: MessageService
        ) {}

        async transform(value: string): Promise<string | any> {
            if (!value) {
                return;
            }

            const enumValues = Object.values(enumType);
            if (!enumValues.includes(value)) {
                throw new BadRequestException({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: this.messageService.setMessage('request.enum', {
                        properties: {
                            property: field,
                            value: value,
                            enum: enumValues.join(', '),
                        },
                    }),
                });
            }

            return value;
        }
    }
    return mixin(MixinRequestEnumPipe);
}
