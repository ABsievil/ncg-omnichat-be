import { PipeTransform, Query, Type } from '@nestjs/common';
import { RequestRequiredPipe } from 'src/common/request/pipes/request.required.pipe';

export function RequireQuery(
    field: string,
    ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator {
    return Query(field, RequestRequiredPipe(field), ...pipes);
}
