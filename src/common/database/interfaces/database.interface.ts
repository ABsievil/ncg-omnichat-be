import { ClientSession, Document, PopulateOptions } from 'mongoose';
import { IPaginationOrder } from 'src/common/pagination/interfaces/pagination.interface';

export interface IDatabaseQueryContainOptions {
    fullWord: boolean;
}

export type IDatabaseDocument<T> = T & Document;

// Find
export interface IDatabaseOptions {
    select?: Record<string, boolean | number> | string;
    join?: boolean | PopulateOptions | PopulateOptions[];
    session?: ClientSession;
    withDeleted?: boolean;
    withAllData?: boolean;
    withAvailableDataAndNotDeleted?: boolean; // Lấy tất cả những data không có field deleted và deleted : false
}

export interface IDatabaseExistsOptions extends IDatabaseOptions {
    excludeId?: string;
}

export interface IDatabaseFindOneOptions extends IDatabaseOptions {
    order?: IPaginationOrder;
    collation?: any;
}

export type IDatabaseGetTotalOptions = Omit<IDatabaseOptions, 'select'>;

export interface IDatabaseFindAllPagingOptions {
    limit: number;
    offset?: number;
    lastTime?: Date;
}

export interface IDatabaseFindAllOptions extends IDatabaseFindOneOptions {
    paging?: IDatabaseFindAllPagingOptions;
}

// Action
export type IDatabaseCreateOptions = Pick<IDatabaseOptions, 'session'> & {
    upsert?: boolean;
};
export type IDatabaseUpdateOptions = Omit<
    IDatabaseOptions,
    'select' | 'join'
> & {
    upsert?: boolean;
    arrayFilters?: { [key: string]: any }[];
};
export type IDatabaseDeleteOptions = Omit<IDatabaseOptions, 'select' | 'join'>;
export type IDatabaseSaveOptions = Pick<IDatabaseOptions, 'session'>;

// Bulk
export type IDatabaseCreateManyOptions = Pick<IDatabaseOptions, 'session'>;
export interface IDatabaseUpdateManyOptions
    extends Pick<IDatabaseOptions, 'session' | 'withDeleted'> {
    upsert?: boolean;
}
export type IDatabaseDeleteManyOptions = Pick<
    IDatabaseOptions,
    'session' | 'withDeleted'
>;

// Raw
export type IDatabaseAggregateOptions = Pick<
    IDatabaseOptions,
    'session' | 'withDeleted' | 'withAllData'
>;
export type IDatabaseFindAllAggregateOptions = Omit<
    IDatabaseFindAllOptions,
    'join' | 'select'
>;

export type ILookupOption = {
    from: string;
    localField?: string;
    foreignField: string;
    as: string;
    matchLookup?: Record<string, any>;
    useLookupAsSource?: string; // alias của lookup trước đó
    sourceField?: string; // field cần lấy từ lookup source, mặc định foreignField
    sort?: Record<string, 1 | -1>; // sắp xếp dữ liệu lookup
    sortParentByLookup?: boolean; // sắp xếp lại parent theo thứ tự lookup (mặc định: false)
    mergeToField?: string; // Merge kết quả lookup vào field này
};

export interface IDatabaseBulkWriteOptions
    extends Pick<IDatabaseOptions, 'session'> {
    ordered?: boolean;
}
