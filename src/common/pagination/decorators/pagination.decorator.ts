import { Query } from '@nestjs/common';
import { ENUM_PAGINATION_COMPARE_OPERATOR } from 'src/common/pagination/enums/compare.enum';
import {
    IPaginationFilterDateBetweenOptions,
    IPaginationFilterEqualOptions,
    IPaginationFilterInOptions,
    IPaginationFilterOptions,
    IPaginationQueryOptions,
} from 'src/common/pagination/interfaces/pagination.interface';
import { PaginationFilterCompareTwoNumberPipe } from 'src/common/pagination/pipes/pagination.filter-compare-two-number.pipe';
import { PaginationFilterDateBetweenTimezonePipe } from 'src/common/pagination/pipes/pagination.filter-date-between-timezone.pipe';
import { PaginationFilterDateBetweenPipe } from 'src/common/pagination/pipes/pagination.filter-date-between.pipe';
import { PaginationFilterDateTimezonePipe } from 'src/common/pagination/pipes/pagination.filter-date-timezone.pipe';
import { PaginationFilterEqualPipe } from 'src/common/pagination/pipes/pagination.filter-equal.pipe';
import { PaginationFilterInBooleanPipe } from 'src/common/pagination/pipes/pagination.filter-in-boolean.pipe';
import { PaginationFilterInEnumPipe } from 'src/common/pagination/pipes/pagination.filter-in-enum.pipe';
import { PaginationFilterInPipe } from 'src/common/pagination/pipes/pagination.filter-in.pipe';
import { PaginationFilterNinEnumPipe } from 'src/common/pagination/pipes/pagination.filter-nin-enum.pipe';
import { PaginationFilterNotEqualPipe } from 'src/common/pagination/pipes/pagination.filter-not-equal.pipe';
import { PaginationFilterStringContainPipe } from 'src/common/pagination/pipes/pagination.filter-string-contain.pipe';
import { PaginationOrderPipe } from 'src/common/pagination/pipes/pagination.order.pipe';
import { PaginationPagingPipe } from 'src/common/pagination/pipes/pagination.paging.pipe';
import { PaginationSearchPipe } from 'src/common/pagination/pipes/pagination.search.pipe';

export function PaginationQuery(
    options?: IPaginationQueryOptions
): ParameterDecorator {
    return Query(
        PaginationSearchPipe(options?.availableSearch),
        PaginationPagingPipe(options?.defaultPerPage),
        PaginationOrderPipe(
            options?.defaultOrderBy,
            options?.defaultOrderDirection,
            options?.availableOrderBy
        )
    );
}

export function PaginationQueryFilterInBoolean(
    field: string,
    defaultValue: boolean[],
    options?: IPaginationFilterOptions
): ParameterDecorator {
    return Query(
        options?.queryField ?? field,
        PaginationFilterInBooleanPipe(field, defaultValue, options)
    );
}

export function PaginationQueryFilterInEnum<T>(
    field: string,
    defaultValue: T,
    defaultEnum: Record<string, any>,
    options?: IPaginationFilterOptions
): ParameterDecorator {
    return Query(
        options?.queryField ?? field,
        PaginationFilterInEnumPipe<T>(field, defaultValue, defaultEnum, options)
    );
}

export function PaginationQueryFilterNinEnum<T>(
    field: string,
    defaultValue: T,
    defaultEnum: Record<string, any>,
    options?: IPaginationFilterOptions
): ParameterDecorator {
    return Query(
        options?.queryField ?? field,
        PaginationFilterNinEnumPipe<T>(
            field,
            defaultValue,
            defaultEnum,
            options
        )
    );
}

export function PaginationQueryFilterNotEqual(
    field: string,
    options?: IPaginationFilterEqualOptions
): ParameterDecorator {
    return Query(
        options?.queryField ?? field,
        PaginationFilterNotEqualPipe(field, options)
    );
}

export function PaginationQueryFilterEqual(
    field: string,
    options?: IPaginationFilterEqualOptions
): ParameterDecorator {
    return Query(
        options?.queryField ?? field,
        PaginationFilterEqualPipe(field, options)
    );
}

export function PaginationQueryFilterStringContain(
    field: string,
    options?: IPaginationFilterOptions
): ParameterDecorator {
    return Query(
        options?.queryField ?? field,
        PaginationFilterStringContainPipe(field, options)
    );
}

export function PaginationQueryFilterDateBetween(
    fieldStart: string,
    fieldEnd: string,
    options?: IPaginationFilterDateBetweenOptions
): ParameterDecorator {
    return Query(
        PaginationFilterDateBetweenPipe(fieldStart, fieldEnd, options)
    );
}

export function PaginationFilterCompareTwoNumber(
    field: string,
    operator: ENUM_PAGINATION_COMPARE_OPERATOR,
    options?: IPaginationFilterOptions
): ParameterDecorator {
    return Query(
        PaginationFilterCompareTwoNumberPipe(field, operator, options)
    );
}

export function PaginationQueryFilterIn<T>(
    field: string,
    options?: IPaginationFilterInOptions
): ParameterDecorator {
    return Query(
        options?.queryField ?? field,
        PaginationFilterInPipe<T>(field, options)
    );
}

export function PaginationFilterDateTimezoneOverlap(
    fieldStart: string,
    fieldEnd: string,
    options?: IPaginationFilterDateBetweenOptions & { branchIdField?: string }
): ParameterDecorator {
    return Query(
        PaginationFilterDateTimezonePipe(fieldStart, fieldEnd, options)
    );
}

export function PaginationQueryFilterDateBetweenTimezone(
    fieldStart: string,
    fieldEnd: string,
    options?: IPaginationFilterDateBetweenOptions & { branchIdField?: string }
): ParameterDecorator {
    return Query(
        PaginationFilterDateBetweenTimezonePipe(fieldStart, fieldEnd, options)
    );
}

export function PaginationQueryDateTimezonePipe(
    fieldStart: string,
    fieldEnd: string,
    options?: IPaginationFilterDateBetweenOptions & { branchIdField?: string }
): ParameterDecorator {
    return Query(
        PaginationFilterDateTimezonePipe(fieldStart, fieldEnd, options)
    );
}
