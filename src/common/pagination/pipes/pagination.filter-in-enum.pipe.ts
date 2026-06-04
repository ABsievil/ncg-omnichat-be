import { Inject, Injectable, mixin, Type } from '@nestjs/common';
import { PipeTransform, Scope } from '@nestjs/common/interfaces';
import { REQUEST } from '@nestjs/core';
import { DatabaseService } from 'src/common/database/services/database.service';
import { HelperArrayService } from 'src/common/helper/services/helper.array.service';
import { IPaginationFilterOptions } from 'src/common/pagination/interfaces/pagination.interface';
import { IRequestApp } from 'src/common/request/interfaces/request.interface';

export function PaginationFilterInEnumPipe<T>(
    field: string,
    defaultValue: T,
    defaultEnum: Record<string, any>,
    options?: IPaginationFilterOptions
): Type<PipeTransform> {
    @Injectable({ scope: Scope.REQUEST })
    class MixinPaginationFilterInEnumPipe implements PipeTransform {
        constructor(
            @Inject(REQUEST) protected readonly request: IRequestApp,
            private readonly databaseService: DatabaseService,
            private readonly helperArrayService: HelperArrayService
        ) {}

        async transform(value: string): Promise<any> {
            if (options?.raw) {
                this.addToRequestInstance(value);
                return {
                    [field]: value,
                };
            }

            let finalValue: T[] = defaultValue as T[];

            if (value) {
                const enumValues = Object.values(defaultEnum) as T[];
                const inputValues = value.split(',').map(v => {
                    // Có thể áp dụng cho enum kiểu số
                    const num = Number(v);
                    return !isNaN(num) ? num : v;
                }) as T[];

                finalValue = this.helperArrayService.getIntersection<T>(
                    inputValues,
                    enumValues
                );
            }

            return this.databaseService.filterIn<T>(field, finalValue);
        }

        addToRequestInstance(value: any): void {
            this.request.__pagination = {
                ...this.request.__pagination,
                filters: this.request.__pagination?.filters
                    ? {
                          ...this.request.__pagination?.filters,
                          [field]: value,
                      }
                    : { [field]: value },
            };
        }
    }

    return mixin(MixinPaginationFilterInEnumPipe);
}
