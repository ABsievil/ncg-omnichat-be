import { PipeTransform, Query, Type } from '@nestjs/common';
import { RequestEnumPipe } from 'src/common/request/pipes/enum.pipe';

export function EnumQuery(
    field: string,
    enumType: object | any[],
    ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator {
    return Query(field, RequestEnumPipe(field, enumType), ...pipes);
}
