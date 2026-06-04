import { Inject, Injectable, mixin, Type } from '@nestjs/common';
import { PipeTransform, Scope } from '@nestjs/common/interfaces';
import { REQUEST } from '@nestjs/core';
import { PaginationService } from 'src/common/pagination/services/pagination.service';
import { IRequestApp } from 'src/common/request/interfaces/request.interface';

export function PaginationSearchPipe(
    availableSearch: string[] = []
): Type<PipeTransform> {
    @Injectable({ scope: Scope.REQUEST })
    class MixinPaginationSearchPipe implements PipeTransform {
        constructor(
            @Inject(REQUEST) protected readonly request: IRequestApp,
            private readonly paginationService: PaginationService
        ) {}

        async transform(
            value: Record<string, any>
        ): Promise<Record<string, any>> {
            const searchValue = value?.search || this.request.query?.search;

            if (availableSearch.length === 0 || !searchValue) {
                this.addToRequestInstance(searchValue, availableSearch);
                return {
                    ...value,
                    search: searchValue,
                };
            }

            const search: Record<string, any> = this.paginationService.search(
                searchValue,
                availableSearch
            );

            this.addToRequestInstance(searchValue, availableSearch);
            return {
                ...value,
                search: searchValue,
                _search: search,
                _availableSearch: availableSearch,
            };
        }

        addToRequestInstance(search: string, availableSearch: string[]): void {
            this.request.__pagination = {
                ...this.request.__pagination,
                search,
                availableSearch,
            };
        }
    }

    return mixin(MixinPaginationSearchPipe);
}
