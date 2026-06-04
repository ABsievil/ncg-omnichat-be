import { PipeTransform, Query, Type } from '@nestjs/common';
import { RequestArrayPipe } from 'src/common/request/pipes/array.pipe';

export function ArrayQuery(
    field: string,
    separator: string,
    ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator {
    return Query(field, RequestArrayPipe(separator), ...pipes);
}
