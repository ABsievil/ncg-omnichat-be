import { Inject, Injectable, mixin, Type } from '@nestjs/common';
import { PipeTransform, Scope } from '@nestjs/common/interfaces';
import { REQUEST } from '@nestjs/core';
import { DateTime } from 'luxon';
import { DatabaseService } from 'src/common/database/services/database.service';
import { IPaginationFilterDateBetweenOptions } from 'src/common/pagination/interfaces/pagination.interface';
import { IRequestApp } from 'src/common/request/interfaces/request.interface';
import { requestContextStorage } from 'src/common/response/contexts/request-async-local-storage.context';

export function PaginationFilterDateBetweenTimezonePipe(
    fieldStart: string,
    fieldEnd: string,
    options?: IPaginationFilterDateBetweenOptions & { branchIdField?: string }
): Type<PipeTransform> {
    @Injectable({ scope: Scope.REQUEST })
    class MixinPaginationFilterDateBetweenTimezonePipe
        implements PipeTransform
    {
        constructor(
            @Inject(REQUEST) protected readonly request: IRequestApp,
            private readonly databaseService: DatabaseService
        ) {}

        async transform(value: object): Promise<any> {
            const finalFieldStart = options?.queryFieldStart ?? fieldStart;
            const finalFieldEnd = options?.queryFieldEnd ?? fieldEnd;
            const branchIdField = options?.branchIdField ?? 'branchId';

            if (!value?.[finalFieldStart] || !value?.[finalFieldEnd]) {
                return;
            }

            // Lấy branchId từ query params, body, hoặc request context
            const branchId =
                value[branchIdField] ||
                this.request.query?.[branchIdField] ||
                this.request.body?.[branchIdField];

            if (!branchId) {
                return;
            }

            // Lấy timezone offset từ context
            const context = requestContextStorage.getStore();
            const offset = Number(
                context?.timezoneAndLocale?.get(branchId)?.utc
            );

            if (isNaN(offset)) {
                return;
            }

            const zone = `UTC${offset >= 0 ? '+' : ''}${offset}`;

            const finalStartValue = this.convertToUTC(
                value[finalFieldStart],
                zone
            );
            const finalEndValue = this.convertToUTC(value[finalFieldEnd], zone);

            if (!finalStartValue || !finalEndValue) {
                return;
            }

            this.addToRequestInstance(finalStartValue, finalEndValue);

            return this.databaseService.filterDateBetween(
                fieldStart,
                fieldEnd,
                finalStartValue,
                finalEndValue
            );
        }

        private convertToUTC(value: any, zone: string): Date | null {
            if (!value) return null;
            if (typeof value !== 'string') return null;

            const date = DateTime.fromISO(value, { zone }).toUTC();
            if (!date.isValid) return null;

            return new Date(date.toISO());
        }

        addToRequestInstance(startValue: Date, endValue: Date): void {
            const finalFieldStart = options?.queryFieldStart ?? fieldStart;
            const finalFieldEnd = options?.queryFieldEnd ?? fieldEnd;

            this.request.__pagination = {
                ...this.request.__pagination,
                filters: this.request.__pagination?.filters
                    ? {
                          ...this.request.__pagination?.filters,
                          [finalFieldStart]: startValue,
                          [finalFieldEnd]: endValue,
                      }
                    : {
                          [finalFieldStart]: startValue,
                          [finalFieldEnd]: endValue,
                      },
            };
        }
    }

    return mixin(MixinPaginationFilterDateBetweenTimezonePipe);
}
