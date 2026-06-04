import { PipeTransform, Query, Type } from '@nestjs/common';
import { RequestDatePipe } from 'src/common/request/pipes/request.date';

export function DateQuery(
    field: string,
    ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator {
    return Query(field, RequestDatePipe(field), ...pipes);
}
