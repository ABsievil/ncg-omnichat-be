import { Inject, Injectable, mixin, Type } from '@nestjs/common';
import { PipeTransform, Scope } from '@nestjs/common/interfaces';
import { REQUEST } from '@nestjs/core';
import { DatabaseService } from 'src/common/database/services/database.service';
import { HelperArrayService } from 'src/common/helper/services/helper.array.service';
import { ENUM_PAGINATION_COMPARE_OPERATOR } from 'src/common/pagination/enums/compare.enum';
import { IPaginationFilterOptions } from 'src/common/pagination/interfaces/pagination.interface';
import { IRequestApp } from 'src/common/request/interfaces/request.interface';

export function PaginationFilterCompareTwoNumberPipe(
    field: string,
    operator: ENUM_PAGINATION_COMPARE_OPERATOR,
    options?: IPaginationFilterOptions
): Type<PipeTransform> {
    @Injectable({ scope: Scope.REQUEST })
    class MixinPaginationFilterCompareTwoNumberPipe implements PipeTransform {
        constructor(
            @Inject(REQUEST) protected readonly request: IRequestApp,
            private readonly databaseService: DatabaseService,
            private readonly helperArrayService: HelperArrayService
        ) {}

        async transform(value: string | Record<string, any>): Promise<any> {
            if (options?.raw) {
                this.addToRequestInstance(value);
                return {
                    [field]: value,
                };
            }

            let actualValue: string;
            if (typeof value === 'object' && value !== null) {
                actualValue = value[field];
            } else {
                actualValue = value as string;
            }

            if (!actualValue || typeof actualValue !== 'string') {
                return {};
            }

            const splitResult = actualValue.split(',');
            const [fieldNumber1, fieldNumber2] = splitResult;

            if (!fieldNumber1 || !fieldNumber2 || splitResult.length !== 2) {
                return {};
            }

            const mongoField1 = fieldNumber1.startsWith('$')
                ? fieldNumber1.trim()
                : `$${fieldNumber1.trim()}`;
            const mongoField2 = fieldNumber2.startsWith('$')
                ? fieldNumber2.trim()
                : `$${fieldNumber2.trim()}`;

            return this.databaseService.filterCompareTwoNumber(
                operator,
                mongoField1,
                mongoField2
            );
        }

        addToRequestInstance(value: any): void {
            this.request.__pagination = {
                ...this.request.__pagination,
                filters: this.request.__pagination?.filters
                    ? {
                          ...this.request.__pagination?.filters,
                          [field]: value,
                      }
                    : {
                          [field]: value,
                      },
            };
        }
    }

    return mixin(MixinPaginationFilterCompareTwoNumberPipe);
}
