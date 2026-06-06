import { Inject, Injectable, mixin, Type } from '@nestjs/common';
import { PipeTransform, Scope } from '@nestjs/common/interfaces';
import { REQUEST } from '@nestjs/core';
import { DatabaseService } from 'src/common/database/services/database.service';
import { IPaginationFilterInOptions } from 'src/common/pagination/interfaces/pagination.interface';
import { IRequestApp } from 'src/common/request/interfaces/request.interface';

export function PaginationFilterInPipe<T>(
    field: string,
    options?: IPaginationFilterInOptions
): Type<PipeTransform> {
    @Injectable({ scope: Scope.REQUEST })
    class MixinPaginationFilterInEnumPipe implements PipeTransform {
        constructor(
            @Inject(REQUEST) protected readonly request: any,
            private readonly databaseService: DatabaseService
        ) {}

        async transform(value: string): Promise<any> {
            if (!value) {
                return;
            }

            if (options?.raw) {
                this.addToRequestInstance(value);
                return {
                    [field]: value,
                };
            }

            let finalValue: any[] = [];
            if (options?.isNumber) {
                finalValue = value
                    .split(',')
                    .map(v => Number.parseInt(v)) as T[];
            } else {
                finalValue = value.split(',') as T[];
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
