import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DeleteResult, InsertManyResult, UpdateResult } from 'mongodb';
import {
    Model,
    PipelineStage,
    PopulateOptions,
    UpdateQuery,
    UpdateWithAggregationPipeline,
} from 'mongoose';
import { DatabaseEntityBase } from 'src/common/database/entities/database.entity';
import {
    DATABASE_AUDIT_FIELD,
} from 'src/common/database/constants/database.constant';
import {
    IDatabaseAggregateOptions,
    IDatabaseCreateManyOptions,
    IDatabaseCreateOptions,
    IDatabaseDeleteManyOptions,
    IDatabaseDeleteOptions,
    IDatabaseDocument,
    IDatabaseExistsOptions,
    IDatabaseFindAllAggregateOptions,
    IDatabaseFindAllOptions,
    IDatabaseFindOneOptions,
    IDatabaseGetTotalOptions,
    IDatabaseOptions,
    IDatabaseSaveOptions,
    IDatabaseUpdateManyOptions,
    IDatabaseUpdateOptions,
    ILookupOption,
} from 'src/common/database/interfaces/database.interface';
import {
    PAGINATION_DEFAULT_ORDER_BY,
    PAGINATION_DEFAULT_ORDER_DIRECTION,
} from 'src/common/pagination/constants/pagination.constant';
import { ENUM_PAGINATION_ORDER_DIRECTION_TYPE } from 'src/common/pagination/enums/pagination.enum';
import type { IRequestApp } from 'src/common/request/interfaces/request.interface';

export abstract class DatabaseRepositoryBaseHelper<
    Entity extends DatabaseEntityBase,
    EntityDocument extends IDatabaseDocument<Entity>,
> {
    protected readonly _repository: Model<Entity>;
    readonly _join?: PopulateOptions | (string | PopulateOptions)[];

    @Inject(REQUEST) public readonly _request: IRequestApp;

    constructor(
        repository: Model<Entity>,
        options?: PopulateOptions | (string | PopulateOptions)[]
    ) {
        this._repository = repository;
        this._join = options;
    }

    protected getCurrentUser(): any {
        if (!this._request) {
            return null;
        }
        const user = this._request.user;
        return user || null;
    }

    protected getCurrentUserId(): string | null {
        const user = this.getCurrentUser();
        if (!user) {
            return null;
        }
        return user._id;
    }

    private isDefaultOrder(order?: Record<string, any>): boolean {
        return (
            !order ||
            JSON.stringify(order) ===
                JSON.stringify({
                    [PAGINATION_DEFAULT_ORDER_BY]:
                        PAGINATION_DEFAULT_ORDER_DIRECTION,
                })
        );
    }

    // Find
    async findAll<T = EntityDocument>(
        find?: Record<string, any>,
        options?: IDatabaseFindAllOptions
    ): Promise<T[]> {
        const repository = this._repository.find<T>({
            ...find,
            deleted: options?.withDeleted ?? false,
        });

        if (options?.collation) {
            repository.collation(options.collation);
        }

        if (options?.paging?.lastTime) {
            repository
                .where('updatedAt')
                .lt(new Date(options.paging.lastTime) as any);
        }

        if (options?.select) {
            repository.select(options.select);
        }

        if (options?.paging?.limit) {
            repository.limit(options.paging.limit);
        }

        if (options?.paging?.offset) {
            repository.skip(options.paging.offset);
        }

        if (options?.order) {
            repository.sort(options.order);
        }

        if (options?.join) {
            repository.populate(
                (typeof options.join === 'boolean' && options.join
                    ? this._join
                    : options.join) as
                    | PopulateOptions
                    | (string | PopulateOptions)[]
            );
        }

        if (options?.session) {
            repository.session(options.session);
        }

        return repository.exec() as Promise<T[]>;
    }

    async findOne<T = EntityDocument>(
        find: Record<string, any>,
        options?: IDatabaseFindOneOptions
    ): Promise<T> {
        const repository = this._repository.findOne<T>({
            ...find,
            ...(options?.withAllData
                ? {}
                : { deleted: options?.withDeleted ?? false }),
        });

        if (options?.select) {
            repository.select(options.select);
        }

        if (options?.join) {
            repository.populate(
                (typeof options.join === 'boolean' && options.join
                    ? this._join
                    : options.join) as
                    | PopulateOptions
                    | (string | PopulateOptions)[]
            );
        }

        if (options?.order) {
            repository.sort(options.order);
        }

        if (options?.session) {
            repository.session(options.session);
        }

        return repository.exec() as Promise<T>;
    }

    async findOneById<T = EntityDocument>(
        _id: string,
        options?: IDatabaseFindOneOptions
    ): Promise<T> {
        const repository = this._repository.findOne<T>({
            _id,
            deleted: options?.withDeleted ?? false,
        });

        if (options?.select) {
            repository.select(options.select);
        }

        if (options?.join) {
            repository.populate(
                (typeof options.join === 'boolean' && options.join
                    ? this._join
                    : options.join) as
                    | PopulateOptions
                    | (string | PopulateOptions)[]
            );
        }

        if (options?.order) {
            repository.sort(options.order);
        }

        if (options?.session) {
            repository.session(options.session);
        }

        return repository.exec() as Promise<T>;
    }

    async findOneAndLock<T = EntityDocument>(
        find: Record<string, any>,
        options?: IDatabaseFindOneOptions
    ): Promise<T> {
        const repository = this._repository.findOneAndUpdate<T>(
            {
                ...find,
                deleted: options?.withDeleted ?? false,
            },
            {
                new: true,
                useFindAndModify: false,
            }
        );

        if (options?.select) {
            repository.select(options.select);
        }

        if (options?.join) {
            repository.populate(
                (typeof options.join === 'boolean' && options.join
                    ? this._join
                    : options.join) as
                    | PopulateOptions
                    | (string | PopulateOptions)[]
            );
        }

        if (options?.order) {
            repository.sort(options.order);
        }

        if (options?.session) {
            repository.session(options.session);
        }

        return repository.exec() as Promise<T>;
    }

    async findOneByIdAndLock<T = EntityDocument>(
        _id: string,
        options?: IDatabaseFindOneOptions
    ): Promise<T> {
        const repository = this._repository.findOneAndUpdate<T>(
            {
                _id,
                deleted: options?.withDeleted ?? false,
            },
            {
                new: true,
                useFindAndModify: false,
            }
        );

        if (options?.select) {
            repository.select(options.select);
        }

        if (options?.join) {
            repository.populate(
                (typeof options.join === 'boolean' && options.join
                    ? this._join
                    : options.join) as
                    | PopulateOptions
                    | (string | PopulateOptions)[]
            );
        }

        if (options?.order) {
            repository.sort(options.order);
        }

        if (options?.session) {
            repository.session(options.session);
        }

        return repository.exec() as Promise<T>;
    }

    async getTotal(
        find?: Record<string, any>,
        options?: IDatabaseGetTotalOptions
    ): Promise<number> {
        const repository = this._repository.countDocuments({
            ...find,
            deleted: options?.withDeleted ?? false,
        });

        if (options?.join) {
            repository.populate(
                (typeof options.join === 'boolean' && options.join
                    ? this._join
                    : options.join) as
                    | PopulateOptions
                    | (string | PopulateOptions)[]
            );
        }

        if (options?.session) {
            repository.session(options.session);
        }

        return repository;
    }

    async exists(
        find: Record<string, any>,
        options?: IDatabaseExistsOptions
    ): Promise<boolean> {
        const repository = this._repository.exists({
            ...find,
            deleted: options?.withDeleted ?? false,
        });

        if (options?.join) {
            repository.populate(
                (typeof options.join === 'boolean' && options.join
                    ? this._join
                    : options.join) as
                    | PopulateOptions
                    | (string | PopulateOptions)[]
            );
        }

        if (options?.session) {
            repository.session(options.session);
        }

        if (options?.excludeId) {
            repository.where('_id').ne(options.excludeId);
        }

        const result = await repository;
        return result ? true : false;
    }

    async create<T extends Entity>(
        data: T,
        options?: IDatabaseCreateOptions
    ): Promise<EntityDocument> {
        data[DATABASE_AUDIT_FIELD.CREATED_BY] = this.getCurrentUserId() ?? undefined;
        const created = await this._repository.create([data as any], options);

        return created[0] as any;
    }

    // Action
    async update(
        find: Record<string, any>,
        data: UpdateQuery<Entity> | UpdateWithAggregationPipeline,
        options?: IDatabaseUpdateOptions
    ): Promise<EntityDocument> {
        (data as Record<string, any>)[DATABASE_AUDIT_FIELD.UPDATED_BY] = this.getCurrentUserId() ?? undefined;
        return this._repository.findOneAndUpdate(
            {
                ...find,
                deleted: options?.withDeleted ?? false,
            },
            data,
            {
                ...options,
                new: true,
            }
        ) as Promise<EntityDocument>;
    }

    async upsert(
        find: Record<string, any>,
        data: UpdateQuery<Entity> | UpdateWithAggregationPipeline,
        byType?: string,
        options?: IDatabaseUpdateOptions
    ): Promise<EntityDocument> {
        if (byType) {
            (data as Record<string, any>)[byType] = this.getCurrentUserId() ?? undefined;
        }
        return this._repository.findOneAndUpdate(
            {
                ...find,
                deleted: options?.withDeleted ?? false,
            },
            data,
            {
                ...options,
                new: true,
                upsert: true,
            }
        ) as Promise<EntityDocument>;
    }

    async delete(
        find: Record<string, any>,
        options?: IDatabaseDeleteOptions
    ): Promise<EntityDocument> {
        return this._repository.findOneAndDelete(
            {
                ...find,
                deleted: options?.withDeleted ?? false,
            },
            {
                ...options,
                new: false,
            }
        ) as Promise<EntityDocument>;
    }

    async save(
        repository: EntityDocument,
        options?: IDatabaseSaveOptions
    ): Promise<EntityDocument> {
        return repository.save(options);
    }

    async join<T = any>(
        repository: EntityDocument,
        joins: PopulateOptions | (string | PopulateOptions)[]
    ): Promise<T> {
        return repository.populate(joins);
    }

    // Soft delete
    async softDelete(
        find: Record<string, any>,
        options?: IDatabaseOptions
    ): Promise<EntityDocument> {
        return this._repository.findOneAndUpdate(
            {
                ...find,
                deleted: options?.withDeleted ?? false,
            },
            {
                [DATABASE_AUDIT_FIELD.DELETED_BY]: this.getCurrentUserId(),
                [DATABASE_AUDIT_FIELD.DELETED_AT]: new Date(),
                [DATABASE_AUDIT_FIELD.DELETED]: true,
            },
            {
                ...options,
                new: true,
            }
        ) as Promise<EntityDocument>;
    }

    // Approve
    async approve(
        find: Record<string, any>,
        data: Record<string, any>,
        options?: IDatabaseOptions
    ): Promise<EntityDocument> {
        return this._repository.findOneAndUpdate(
            {
                ...find,
                deleted: options?.withDeleted ?? false,
            },
            {
                ...data,
                [DATABASE_AUDIT_FIELD.APPROVED_BY]: this.getCurrentUserId(),
                [DATABASE_AUDIT_FIELD.APPROVED_AT]: new Date(),
            },
            {
                ...options,
                new: true,
            }
        ) as Promise<EntityDocument>;
    }

    async restore(
        repository: EntityDocument,
        options?: IDatabaseSaveOptions
    ): Promise<EntityDocument> {
        repository.deletedAt = undefined;
        repository.deleted = false;
        repository.deletedBy = undefined;

        return repository.save(options);
    }

    // Bulk
    async createMany<T = Entity>(
        data: T[],
        options?: IDatabaseCreateManyOptions
    ): Promise<InsertManyResult<Entity>> {
        return this._repository.insertMany(data as any, {
            ...options,
            rawResult: true,
        });
    }

    async updateMany<T = Entity>(
        find: Record<string, any>,
        data: T,
        options?: IDatabaseUpdateManyOptions
    ): Promise<UpdateResult<Entity>> {
        return this._repository.updateMany(
            {
                ...find,
                deleted: options?.withDeleted ?? false,
            },
            {
                $set: data as UpdateQuery<Entity>,
            },
            { ...options, rawResult: true } as any
        ) as Promise<UpdateResult<Entity>>;
    }

    async updateManyRaw(
        find: Record<string, any>,
        data: UpdateQuery<Entity> | UpdateWithAggregationPipeline,
        options?: IDatabaseUpdateManyOptions
    ): Promise<UpdateResult<Entity>> {
        return this._repository.updateMany(
            {
                ...find,
                deleted: options?.withDeleted ?? false,
            },
            data,
            { ...options, rawResult: true } as any
        ) as Promise<UpdateResult<Entity>>;
    }

    async deleteMany(
        find: Record<string, any>,
        options?: IDatabaseDeleteManyOptions
    ): Promise<DeleteResult> {
        return this._repository.deleteMany(
            {
                ...find,
                deleted: options?.withDeleted ?? false,
            },
            { ...options, rawResult: true } as any
        ) as Promise<DeleteResult>;
    }

    async softDeleteMany(
        find: Record<string, any>,
        options?: IDatabaseOptions
    ): Promise<UpdateResult<Entity>> {
        return this._repository.updateMany(
            {
                ...find,
                deleted: false,
            },
            {
                [DATABASE_AUDIT_FIELD.DELETED_BY]: this.getCurrentUserId(),
                [DATABASE_AUDIT_FIELD.DELETED_AT]: new Date(),
                [DATABASE_AUDIT_FIELD.DELETED]: true,
            },
            { ...options, rawResult: true } as any
        );
    }

    async restoreMany(
        find: Record<string, any>,
        options?: IDatabaseOptions
    ): Promise<UpdateResult<Entity>> {
        return this._repository.updateMany(
            {
                ...find,
                deleted: true,
            },
            {
                $set: {
                    deletedAt: undefined,
                    deleted: false,
                    deletedBy: undefined,
                },
            },
            { ...options, rawResult: true } as any
        );
    }

    // Raw
    async aggregate<
        AggregatePipeline extends PipelineStage,
        AggregateResponse = any,
    >(
        pipelines: AggregatePipeline[],
        options?: IDatabaseAggregateOptions
    ): Promise<AggregateResponse[]> {
        if (!Array.isArray(pipelines)) {
            throw new Error('Must in array');
        }

        const newPipelines: PipelineStage[] = [
            {
                $match: {
                    deleted: options?.withDeleted ?? false,
                },
            },
            ...pipelines,
        ];

        const aggregate =
            this._repository.aggregate<AggregateResponse>(newPipelines);

        if (options?.session) {
            aggregate.session(options?.session);
        }

        return aggregate;
    }

    async findAllAggregate<
        AggregatePipeline extends PipelineStage,
        AggregateResponse = any,
    >(
        pipelines: AggregatePipeline[],
        options?: IDatabaseFindAllAggregateOptions
    ): Promise<AggregateResponse[]> {
        if (!Array.isArray(pipelines)) {
            throw new Error('Must in array');
        }

        const newPipelines: PipelineStage[] = [
            {
                $match: {
                    deleted: options?.withDeleted ?? false,
                },
            },
            ...pipelines,
        ];

        if (options?.order) {
            const keysOrder = Object.keys(options.order);
            const order = options.order;
            newPipelines.push({
                $sort: keysOrder.reduce(
                    (a, b) => ({
                        ...a,
                        [b]: order[b] ===
                            ENUM_PAGINATION_ORDER_DIRECTION_TYPE.ASC
                                ? 1
                                : -1,
                    }),
                    {}
                ),
            });
        }

        if (options?.paging) {
            newPipelines.push(
                {
                    $limit: (options.paging.limit ?? 0) + (options.paging.offset ?? 0),
                },
                { $skip: options.paging.offset ?? 0 }
            );
        }

        const aggregate =
            this._repository.aggregate<AggregateResponse>(newPipelines);

        if (options?.session) {
            aggregate.session(options?.session);
        }

        return aggregate;
    }

    async getTotalAggregate<AggregatePipeline extends PipelineStage>(
        pipelines: AggregatePipeline[],
        options?: IDatabaseAggregateOptions
    ): Promise<number> {
        if (!Array.isArray(pipelines)) {
            throw new Error('Must in array');
        }

        const newPipelines: PipelineStage[] = [
            {
                $match: {
                    deleted: options?.withDeleted ?? false,
                },
            },
            ...pipelines,
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                },
            },
        ];

        const aggregate = this._repository.aggregate(newPipelines);

        if (options?.session) {
            aggregate.session(options?.session);
        }

        const raw = await aggregate;
        return raw && raw.length > 0 ? raw[0].count : 0;
    }

    async model(): Promise<Model<Entity>> {
        return this._repository;
    }

    /**
     * @description Phân tách find thành direct fields và lookup searches
     */
    protected parseFindForLookup(
        find: Record<string, any> | undefined,
        lookups: ILookupOption[]
    ): {
        directFind: Record<string, any>;
        lookupSearches: Record<string, any>;
    } {
        if (!find) {
            return { directFind: {}, lookupSearches: {} };
        }

        const lookupAliases = new Set(lookups.map(l => l.as));
        const directFind: Record<string, any> = {};
        const lookupSearches: Record<string, any> = {};

        // Khởi tạo hàm kiểm tra field của lookup)
        const isLookupField = (key: string): boolean => {
            if (!key.includes('.')) return false;
            const [alias] = key.split('.');
            return lookupAliases.has(alias);
        };

        // Xử lý $or riêng biệt
        if (find.$or && Array.isArray(find.$or)) {
            const directOrConditions: any[] = [];

            for (const condition of find.$or) {
                const conditionKeys = Object.keys(condition);
                let isLookupCondition = false;

                for (const key of conditionKeys) {
                    if (isLookupField(key)) {
                        isLookupCondition = true;
                        // Giữ nguyên đường dẫn đầy đủ mà không lồng nhau (ví dụ: 'users.fullName')
                        lookupSearches[key] = condition[key];
                        break;
                    }
                }

                if (!isLookupCondition) {
                    directOrConditions.push(condition);
                }
            }

            // Thêm điều kiện $or trực tiếp nếu có
            if (directOrConditions.length > 0) {
                directFind.$or = directOrConditions;
            }

            // Sao chép các trường không phải $or khác
            for (const [key, value] of Object.entries(find)) {
                if (key !== '$or') {
                    directFind[key] = value;
                }
            }
        } else {
            // Không có $or, xử lý bình thường
            for (const [key, value] of Object.entries(find)) {
                if (isLookupField(key)) {
                    // Trường lookup - giữ nguyên đường dẫn đầy đủ (ví dụ: 'users.fullName', 'customers.name')
                    lookupSearches[key] = value;
                } else {
                    // Trường trực tiếp (bao gồm các trường nested của entity như 'address.city')
                    directFind[key] = value;
                }
            }
        }

        return { directFind, lookupSearches };
    }

    /**
     * @description Phân tích order để tách direct order và lookup order
     */
    protected parseOrderForLookup(
        options?: IDatabaseFindAllOptions,
        lookups?: ILookupOption[]
    ): { directOrder: Record<string, any>; hasLookupOrder: boolean } {
        if (!options?.order) {
            return { directOrder: {}, hasLookupOrder: false };
        }

        const lookupAliases = new Set((lookups || []).map(l => l.as));
        const directOrder: Record<string, any> = {};
        let hasLookupOrder = false;

        for (const [key, value] of Object.entries(options.order)) {
            if (key.includes('.')) {
                const [alias] = key.split('.');
                if (lookupAliases.has(alias)) {
                    hasLookupOrder = true;
                } else {
                    // Không phải lookup, thêm vào direct order
                    directOrder[key] = value;
                }
            } else {
                directOrder[key] = value;
            }
        }

        return { directOrder, hasLookupOrder };
    }

    /**
     * @description Nhóm lookups theo level để xử lý song song trong cùng level
     */
    protected buildLookupLevels(lookups: ILookupOption[]): {
        leveledLookups: ILookupOption[][];
        lookupMap: Map<string, ILookupOption>;
    } {
        const lookupMap = new Map<string, ILookupOption>();
        const levelMap = new Map<string, number>();

        // Xây dựng map lookup
        for (const lookup of lookups) {
            lookupMap.set(lookup.as, lookup);
        }

        // Tính level cho mỗi lookup
        const getLevel = (
            lookupAs: string,
            visited = new Set<string>()
        ): number => {
            if (levelMap.has(lookupAs)) {
                return levelMap.get(lookupAs)!;
            }

            // Phát hiện vòng lặp phụ thuộc
            if (visited.has(lookupAs)) {
                return 0;
            }

            const lookup = lookupMap.get(lookupAs);
            if (!lookup || !lookup.useLookupAsSource) {
                levelMap.set(lookupAs, 0);
                return 0;
            }

            visited.add(lookupAs);
            const sourceLevel = getLevel(lookup.useLookupAsSource, visited);
            const level = sourceLevel + 1;
            levelMap.set(lookupAs, level);
            return level;
        };

        // Tính level cho tất cả lookups
        for (const lookup of lookups) {
            getLevel(lookup.as);
        }

        // Nhóm theo level
        const maxLevel = Math.max(...Array.from(levelMap.values()));
        const leveledLookups: ILookupOption[][] = Array.from(
            { length: maxLevel + 1 },
            () => []
        );

        for (const lookup of lookups) {
            const level = levelMap.get(lookup.as) || 0;
            leveledLookups[level].push(lookup);
        }

        return { leveledLookups, lookupMap };
    }

    /**
     * @description Trích xuất lookup orders từ options.order
     * Ví dụ: { 'users.fullName': 1, 'contacts.name': -1 }
     * => Map { 'users' => { fullName: 1 }, 'contacts' => { name: -1 } }
     */
    protected extractLookupOrdersFromOptions(
        lookups: ILookupOption[],
        options?: IDatabaseFindAllOptions
    ): Map<string, Record<string, 1 | -1>> {
        const lookupOrdersMap = new Map<string, Record<string, 1 | -1>>();

        if (!options?.order) {
            return lookupOrdersMap;
        }

        // Tạo map để tra cứu nhanh lookup alias
        const lookupAliases = new Set(lookups.map(l => l.as));

        for (const [orderKey, direction] of Object.entries(options.order)) {
            if (!orderKey.includes('.')) {
                continue; // Bỏ qua direct order
            }

            const [alias, ...fieldParts] = orderKey.split('.');
            if (!lookupAliases.has(alias)) {
                continue; // Bỏ qua nếu alias không tồn tại
            }

            const field = fieldParts.join('.');
            if (!lookupOrdersMap.has(alias)) {
                lookupOrdersMap.set(alias, {});
            }

            const lookupOrder = lookupOrdersMap.get(alias);
            if (!lookupOrder) {
                continue;
            }
            lookupOrder[field] = direction as 1 | -1;
        }

        return lookupOrdersMap;
    }

    /**
     * @description Find all với lookup - V4
     */
    async findAllWithLookupV4<T = any>(
        find?: Record<string, any>,
        lookupOptions?: ILookupOption | ILookupOption[],
        options?: IDatabaseFindAllOptions,
        fieldName?: string
    ): Promise<T[]> {
        fieldName = this.resolveFieldName(fieldName);
        const lookups = Array.isArray(lookupOptions)
            ? lookupOptions
            : lookupOptions
              ? [lookupOptions]
              : [];

        const pipeline: PipelineStage[] = [];

        // Tách find thành direct search và lookup search
        const { directFind, lookupSearches } = this.parseFindForLookup(
            find,
            lookups
        );

        // Xây dựng pipeline cơ bản
        this.buildBasePipelineV4(
            pipeline,
            directFind,
            options,
            lookups,
            fieldName
        );

        // Xử lý lookups nếu có
        if (lookups.length > 0) {
            const { leveledLookups } = this.buildLookupLevels(lookups);
            const lookupOrdersMap = this.extractLookupOrdersFromOptions(
                lookups,
                options
            );

            // Xây dựng lookups
            this.buildLookupsV4(
                pipeline,
                leveledLookups,
                lookupOrdersMap,
                fieldName
            );

            // Lọc lookup searches
            if (lookupSearches && Object.keys(lookupSearches).length > 0) {
                this.buildLookupSearchFilterV4(
                    pipeline,
                    lookups,
                    lookupSearches,
                    fieldName
                );
            }

            // Lọc collections trong một lần - SAU khi lọc documents
            this.buildFilterStageV4(pipeline, lookups, fieldName);

            // Gộp các lookup vào field chính
            this.buildMergeToFieldStageV4(pipeline, lookups);

            // Sắp xếp parent theo lookup nếu cần
            const { directOrder, hasLookupOrder } = this.parseOrderForLookup(
                options,
                lookups
            );

            if (hasLookupOrder && options?.order) {
                this.buildSortByLookupV4(
                    pipeline,
                    lookups,
                    lookupOrdersMap,
                    fieldName
                );

                // Áp dụng direct order nếu có
                if (options?.paging) {
                    const offset = options.paging.offset || 0;
                    const limit = options.paging.limit;

                    if (limit || offset > 0) {
                        pipeline.push({
                            $addFields: {
                                [fieldName]: {
                                    $slice: [
                                        `$${fieldName}`,
                                        offset,
                                        limit || 999999,
                                    ],
                                },
                            },
                        });
                    }
                }
            }
        }

        pipeline.push({ $project: { _id: 0 } });

        const aggregation = options?.session
            ? this._repository.aggregate(pipeline).session(options.session)
            : this._repository.aggregate(pipeline);

        const result = await aggregation.exec();

        return !result.length
            ? ([{ [fieldName]: [] }] as T[])
            : (result as T[]);
    }

    /**
     * @description Xây dựng pipeline cơ bản
     */
    protected buildBasePipelineV4(
        pipeline: PipelineStage[],
        find: Record<string, any> | undefined,
        options: IDatabaseFindAllOptions | undefined,
        lookups: ILookupOption[],
        fieldName: string
    ): void {
        pipeline.push({
            $match: {
                ...find,
                deleted: options?.withDeleted ?? false,
            },
        });

        if (
            options?.paging?.lastTime &&
            (this.isDefaultOrder(options?.order) || !options?.order)
        ) {
            pipeline.push({
                $match: {
                    updatedAt: { $lt: new Date(options.paging.lastTime) },
                },
            });
        }

        const { directOrder, hasLookupOrder } = this.parseOrderForLookup(
            options,
            lookups
        );

        if (directOrder && Object.keys(directOrder).length > 0) {
            pipeline.push({ $sort: directOrder });
        }

        if (!hasLookupOrder && options?.paging) {
            if (options.paging.offset) {
                pipeline.push({ $skip: options.paging.offset ?? 0 });
            }
            if (options.paging.limit) {
                pipeline.push({ $limit: options.paging.limit });
            }
        }

        if (
            options?.select &&
            typeof options.select === 'object' &&
            Object.keys(options.select).length > 0
        ) {
            pipeline.push({ $project: options.select });
        }

        pipeline.push({
            $group: {
                _id: null,
                [fieldName]: { $push: '$$ROOT' },
            },
        });
    }

    /**
     * @description Tạo expression để lấy localIds, hỗ trợ cả direct và nested path
     * @example
     * - Direct: localField="userId" -> $branches.userId
     * - Nested: localField="userId.accountId" with userId=[{accountId:"123"}]
     *   -> extracts all accountId values from nested array using MongoDB dot notation
     *
     * Note: Với nested path, cần dùng $map để extract từ mỗi document
     * - MongoDB dot notation ($$doc.userId.accountId) tự động flatten arrays
     * - Ví dụ: userId: [{accountId: "123"}, {accountId: "456"}]
     * -> $$doc.userId.accountId sẽ trả về ["123", "456"]
     */
    protected buildLocalIdsExpression(
        localField: string,
        fieldName: string
    ): any {
        const isNestedPath = localField.includes('.');

        if (!isNestedPath) {
            return `$${fieldName}.${localField}`;
        }

        return {
            $reduce: {
                input: {
                    $map: {
                        input: `$${fieldName}`,
                        as: 'doc',
                        in: `$$doc.${localField}`,
                    },
                },
                initialValue: [],
                in: {
                    $concatArrays: [
                        '$$value',
                        {
                            $cond: {
                                if: { $isArray: '$$this' },
                                then: '$$this',
                                else: {
                                    $cond: {
                                        if: { $ne: ['$$this', null] },
                                        then: ['$$this'],
                                        else: [],
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        };
    }

    /**
     * @description Xây dựng lookups
     */
    protected buildLookupsV4(
        pipeline: PipelineStage[],
        leveledLookups: ILookupOption[][],
        lookupOrdersMap: Map<string, Record<string, 1 | -1>>,
        fieldName: string
    ): void {
        for (const levelLookups of leveledLookups) {
            for (const lookup of levelLookups) {
                const lookupPipeline: any[] = [];

                if (lookup.matchLookup) {
                    lookupPipeline.push({ $match: lookup.matchLookup });
                }

                // Xây dựng lookup
                if (lookup.useLookupAsSource) {
                    // Nested lookup
                    pipeline.push({
                        $lookup: {
                            from: lookup.from,
                            let: {
                                sourceIds: `$${lookup.useLookupAsSource}.${lookup.sourceField || lookup.foreignField}`,
                            },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $in: [
                                                `$${lookup.foreignField}`,
                                                {
                                                    $cond: {
                                                        if: {
                                                            $isArray:
                                                                '$$sourceIds',
                                                        },
                                                        then: '$$sourceIds',
                                                        else: ['$$sourceIds'],
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                                ...lookupPipeline,
                            ],
                            as: lookup.as,
                        },
                    });
                } else {
                    // Normal lookup
                    if (!lookup.localField) {
                        continue;
                    }
                    const localIdsExpression = this.buildLocalIdsExpression(
                        lookup.localField,
                        fieldName
                    );

                    pipeline.push({
                        $lookup: {
                            from: lookup.from,
                            let: {
                                localIds: localIdsExpression,
                            },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $in: [
                                                `$${lookup.foreignField}`,
                                                {
                                                    $reduce: {
                                                        input: '$$localIds',
                                                        initialValue: [],
                                                        in: {
                                                            $concatArrays: [
                                                                '$$value',
                                                                {
                                                                    $cond: {
                                                                        if: {
                                                                            $isArray:
                                                                                '$$this',
                                                                        },
                                                                        then: '$$this',
                                                                        else: [
                                                                            '$$this',
                                                                        ],
                                                                    },
                                                                },
                                                            ],
                                                        },
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                                ...lookupPipeline,
                            ],
                            as: lookup.as,
                        },
                    });
                }
            }
        }
    }

    /**
     * @description Lọc lookup searches
     */
    protected buildFilterStageV4(
        pipeline: PipelineStage[],
        lookups: ILookupOption[],
        fieldName: string
    ): void {
        const filterFields: Record<string, any> = {};

        for (const lookup of lookups) {
            if (!lookup.useLookupAsSource) {
                // Lọc lookup bình thường sử dụng $setIntersection
                filterFields[lookup.as] = {
                    $filter: {
                        input: `$${lookup.as}`,
                        as: 'item',
                        cond: {
                            $gt: [
                                {
                                    $size: {
                                        $setIntersection: [
                                            [
                                                {
                                                    $cond: {
                                                        if: {
                                                            $isArray: `$$item.${lookup.foreignField}`,
                                                        },
                                                        then: {
                                                            $arrayElemAt: [
                                                                `$$item.${lookup.foreignField}`,
                                                                0,
                                                            ],
                                                        },
                                                        else: `$$item.${lookup.foreignField}`,
                                                    },
                                                },
                                            ],
                                            {
                                                $reduce: {
                                                    input: `$${fieldName}`,
                                                    initialValue: [],
                                                    in: {
                                                        $concatArrays: [
                                                            '$$value',
                                                            {
                                                                $cond: {
                                                                    if: {
                                                                        $isArray: `$$this.${lookup.localField}`,
                                                                    },
                                                                    then: `$$this.${lookup.localField}`,
                                                                    else: [
                                                                        `$$this.${lookup.localField}`,
                                                                    ],
                                                                },
                                                            },
                                                        ],
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                                0,
                            ],
                        },
                    },
                };
            } else {
                // Lọc lookup lồng nhau
                const sourceField = lookup.sourceField || lookup.foreignField;
                filterFields[lookup.as] = {
                    $filter: {
                        input: `$${lookup.as}`,
                        as: 'item',
                        cond: {
                            $in: [
                                `$$item.${lookup.foreignField}`,
                                {
                                    $reduce: {
                                        input: `$${lookup.useLookupAsSource}`,
                                        initialValue: [],
                                        in: {
                                            $concatArrays: [
                                                '$$value',
                                                {
                                                    $cond: {
                                                        if: {
                                                            $isArray: `$$this.${sourceField}`,
                                                        },
                                                        then: `$$this.${sourceField}`,
                                                        else: [
                                                            `$$this.${sourceField}`,
                                                        ],
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                            ],
                        },
                    },
                };
            }
        }

        // Áp dụng tất cả các bộ lọc trong một stage
        if (Object.keys(filterFields).length > 0) {
            pipeline.push({ $addFields: filterFields });
        }
    }

    /**
     * @description Gộp các lookup vào field chính
     */
    protected buildMergeToFieldStageV4(
        pipeline: PipelineStage[],
        lookups: ILookupOption[]
    ): void {
        const mergeMap = new Map<string, string[]>();

        for (const lookup of lookups) {
            if (lookup.mergeToField) {
                if (!mergeMap.has(lookup.mergeToField)) {
                    mergeMap.set(lookup.mergeToField, []);
                }
                mergeMap.get(lookup.mergeToField)!.push(lookup.as);
            }
        }

        if (mergeMap.size > 0) {
            const addFields: Record<string, any> = {};
            const unsetFields: string[] = [];

            for (const [targetField, sourceFields] of mergeMap) {
                addFields[targetField] = {
                    $setUnion: sourceFields.map(field => `$${field}`),
                };
                unsetFields.push(...sourceFields);
            }

            pipeline.push({ $addFields: addFields });

            if (unsetFields.length > 0) {
                pipeline.push({ $unset: unsetFields });
            }
        }
    }

    /**
     * @description Build path từ lookup alias về gốc
     * Ví dụ: contacts → contactLinks → shop (gốc)
     */
    protected buildLookupPath(
        targetLookup: ILookupOption,
        allLookups: ILookupOption[]
    ): ILookupOption[] {
        const path: ILookupOption[] = [targetLookup];
        let current = targetLookup;

        // Truy ngược về gốc
        while (current.useLookupAsSource) {
            const parent = allLookups.find(
                l => l.as === current.useLookupAsSource
            );
            if (!parent) break;
            path.unshift(parent);
            current = parent;
        }

        return path;
    }

    /**
     * @description Tạo aggregation expression để lấy sort value theo path
     * Path: shop → contactLinks → contacts
     * Result: Lấy contact.fullName từ shop document
     */
    protected buildSortValueExpression(
        path: ILookupOption[],
        sortField: string,
        defaultValue: string,
        fieldName: string
    ): any {
        if (path.length === 1) {
            // Direct lookup: shop.customerId → customer.name
            const lookup = path[0];
            const localFieldValue = {
                $cond: {
                    if: { $isArray: `$$doc.${lookup.localField}` },
                    then: {
                        $arrayElemAt: [`$$doc.${lookup.localField}`, 0],
                    },
                    else: `$$doc.${lookup.localField}`,
                },
            };

            return {
                $ifNull: [
                    {
                        $getField: {
                            field: {
                                $ifNull: [
                                    { $toString: localFieldValue },
                                    '__null__',
                                ],
                            },
                            input: `$__${lookup.as}_map`,
                        },
                    },
                    defaultValue,
                ],
            };
        }

        // Nested lookup: build expression đệ quy
        // Ví dụ path [contactLinks, contacts]:
        // 1. Lấy shop.contactLinkIds[0] → contactLinkId
        // 2. Filter contactLinks.filter(_id === contactLinkId)[0] → contactLink
        // 3. Lấy contactLink.contactId → contactId
        // 4. Filter contacts.filter(_id === contactId)[0] → contact
        // 5. Lấy contact.fullName

        const buildNestedExpression = (
            index: number,
            parentIdVar: string
        ): any => {
            const lookup = path[index];
            const isLast = index === path.length - 1;

            const findItem = {
                $arrayElemAt: [
                    {
                        $filter: {
                            input: `$${lookup.as}`,
                            as: 'item',
                            cond: {
                                $eq: [
                                    `$$item.${lookup.foreignField}`,
                                    `$$${parentIdVar}`,
                                ],
                            },
                        },
                    },
                    0,
                ],
            };

            if (isLast) {
                // Level cuối: return sort value
                return {
                    $let: {
                        vars: { [`${lookup.as}_item`]: findItem },
                        in: {
                            $ifNull: [
                                `$$${lookup.as}_item.${sortField}`,
                                defaultValue,
                            ],
                        },
                    },
                };
            }

            // Level giữa: lấy link field và đệ quy
            const nextLookup = path[index + 1];
            const linkField = nextLookup.sourceField || nextLookup.foreignField;
            const nextIdVar = `${nextLookup.as}_link_id`;

            return {
                $let: {
                    vars: { [`${lookup.as}_item`]: findItem },
                    in: {
                        $let: {
                            vars: {
                                [nextIdVar]: `$$${lookup.as}_item.${linkField}`,
                            },
                            in: buildNestedExpression(index + 1, nextIdVar),
                        },
                    },
                },
            };
        };

        // Bắt đầu từ root document
        const firstLookup = path[0];
        const firstIdValue = {
            $cond: {
                if: { $isArray: `$$doc.${firstLookup.localField}` },
                then: {
                    $arrayElemAt: [`$$doc.${firstLookup.localField}`, 0],
                },
                else: `$$doc.${firstLookup.localField}`,
            },
        };

        return {
            $let: {
                vars: { [`${firstLookup.as}_link_id`]: firstIdValue },
                in: buildNestedExpression(0, `${firstLookup.as}_link_id`),
            },
        };
    }

    protected buildSortByLookupV4(
        pipeline: PipelineStage[],
        lookups: ILookupOption[],
        lookupOrdersMap: Map<string, Record<string, 1 | -1>>,
        fieldName: string
    ): void {
        const sortableLookups = lookups.filter(
            l =>
                (l.sort || lookupOrdersMap.get(l.as)) &&
                l.sortParentByLookup !== false
        );

        if (!sortableLookups.length) return;

        // Prepare sort configs
        const sortConfigs: Array<{
            lookup: ILookupOption;
            path: ILookupOption[];
            sortField: string;
            direction: 1 | -1;
            alias: string;
        }> = [];

        for (const lookup of sortableLookups) {
            const lookupOrders = lookupOrdersMap.get(lookup.as) || lookup.sort;
            if (!lookupOrders) continue;

            const [sortField, direction] = Object.entries(lookupOrders)[0];
            const path = this.buildLookupPath(lookup, lookups);

            sortConfigs.push({
                lookup,
                path,
                sortField,
                direction: direction as 1 | -1,
                alias: `__sort_${lookup.as}`,
            });
        }

        // Tạo value maps cho direct lookups (path.length === 1)
        const valueMaps: Record<string, any> = {};
        for (const config of sortConfigs) {
            if (config.path.length === 1) {
                const lookup = config.path[0];
                valueMaps[`__${lookup.as}_map`] = {
                    $arrayToObject: {
                        $map: {
                            input: `$${lookup.as}`,
                            as: 'item',
                            in: {
                                k: {
                                    $toString: `$$item.${lookup.foreignField}`,
                                },
                                v: {
                                    $ifNull: [
                                        `$$item.${config.sortField}`,
                                        config.direction === 1 ? '\uffff' : '',
                                    ],
                                },
                            },
                        },
                    },
                };
            }
        }

        if (Object.keys(valueMaps).length > 0) {
            pipeline.push({ $addFields: valueMaps });
        }

        // Build sortBy object
        const sortBy: Record<string, number> = {};
        sortConfigs.forEach(config => {
            sortBy[config.alias] = config.direction;
        });

        // Sort parent documents
        pipeline.push({
            $addFields: {
                [fieldName]: {
                    $sortArray: {
                        input: {
                            $map: {
                                input: `$${fieldName}`,
                                as: 'doc',
                                in: {
                                    $mergeObjects: [
                                        '$$doc',
                                        ...sortConfigs.map(config => ({
                                            [config.alias]:
                                                this.buildSortValueExpression(
                                                    config.path,
                                                    config.sortField,
                                                    config.direction === 1
                                                        ? '\uffff'
                                                        : '',
                                                    fieldName
                                                ),
                                        })),
                                    ],
                                },
                            },
                        },
                        sortBy,
                    },
                },
            },
        });

        // Cleanup: xóa value maps
        if (Object.keys(valueMaps).length > 0) {
            pipeline.push({
                $project: Object.keys(valueMaps).reduce(
                    (acc, key) => {
                        acc[key] = 0;
                        return acc;
                    },
                    {} as Record<string, number>
                ),
            });
        }

        // Cleanup: xóa sort fields khỏi documents
        pipeline.push({
            $addFields: {
                [fieldName]: {
                    $map: {
                        input: `$${fieldName}`,
                        as: 'doc',
                        in: {
                            $arrayToObject: {
                                $filter: {
                                    input: { $objectToArray: '$$doc' },
                                    as: 'field',
                                    cond: {
                                        $not: {
                                            $regexMatch: {
                                                input: '$$field.k',
                                                regex: '^__sort_',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    /**
     * @description Xây dựng filter cho lookup searches
     */
    protected buildLookupSearchFilterV4(
        pipeline: PipelineStage[],
        lookups: ILookupOption[],
        lookupSearches: Record<string, any>,
        fieldName: string
    ): void {
        // Xây dựng điều kiện cho mỗi lookup search
        const lookupConditions = Object.entries(lookupSearches)
            .map(([fullPath, searchCondition]) => {
                // Phân tích fullPath (ví dụ: 'users.fullName' -> alias='users', field='fullName')
                const [lookupAlias, ...fieldParts] = fullPath.split('.');
                const searchField = fieldParts.join('.');

                // Tìm cấu hình lookup
                const lookup = lookups.find(l => l.as === lookupAlias);
                if (!lookup) return null;

                return {
                    lookupAlias,
                    searchField,
                    searchCondition,
                    lookup,
                };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);

        if (lookupConditions.length > 0) {
            pipeline.push({
                $addFields: {
                    [fieldName]: {
                        $filter: {
                            input: `$${fieldName}`,
                            as: 'doc',
                            cond: {
                                $or: lookupConditions.map(config => {
                                    // Kiểm tra nếu ít nhất một mục lookup khớp với tìm kiếm
                                    return {
                                        $gt: [
                                            {
                                                $size: {
                                                    $filter: {
                                                        input: `$${config.lookupAlias}`,
                                                        as: 'lookupItem',
                                                        cond: {
                                                            $and: [
                                                                // So khớp foreignField với localField của document
                                                                {
                                                                    $in: [
                                                                        `$$lookupItem.${config.lookup.foreignField}`,
                                                                        {
                                                                            $cond: {
                                                                                if: {
                                                                                    $isArray: `$$doc.${config.lookup.localField}`,
                                                                                },
                                                                                then: `$$doc.${config.lookup.localField}`,
                                                                                else: [
                                                                                    `$$doc.${config.lookup.localField}`,
                                                                                ],
                                                                            },
                                                                        },
                                                                    ],
                                                                },
                                                                // So khớp regex trên trường tìm kiếm
                                                                {
                                                                    $regexMatch:
                                                                        {
                                                                            input: {
                                                                                $toString: `$$lookupItem.${config.searchField}`,
                                                                            },
                                                                            regex: config
                                                                                .searchCondition
                                                                                .$regex,
                                                                            options:
                                                                                config
                                                                                    .searchCondition
                                                                                    .$options ||
                                                                                'i',
                                                                        },
                                                                },
                                                            ],
                                                        },
                                                    },
                                                },
                                            },
                                            0,
                                        ],
                                    };
                                }),
                            },
                        },
                    },
                },
            });
        }
    }

    /**
     * @description Xây dựng truy vấn aggregate cho danh sách kèm lookup, sắp xếp, phân trang.
     */
    async findAllWithLookup<T = any>(
        find?: Record<string, any>,
        lookupOptions?: ILookupOption | ILookupOption[],
        options?: IDatabaseFindAllOptions,
        fieldName?: string
    ): Promise<T[]> {
        fieldName = this.resolveFieldName(fieldName);
        const lookups = this.normalizeLookupOptions(lookupOptions);
        const { pipeline, hasLookupOrder } = this.buildFindAllPipeline(
            find,
            options,
            fieldName
        );

        const result = await this.executeFindAllPipeline(
            pipeline,
            options,
            fieldName
        );

        if (lookups.length) {
            await this.processLookups(result, fieldName, lookups, options);
        }

        this.sortLookupOrders(result, lookups, options, fieldName);
        this.applyPostLookupPagination(
            result,
            options,
            hasLookupOrder,
            fieldName
        );

        return [result] as T[];
    }

    /**
     * @description Chuẩn hóa lookup options thành mảng.
     */
    protected normalizeLookupOptions(
        lookupOptions?: ILookupOption | ILookupOption[]
    ): ILookupOption[] {
        if (!lookupOptions) return [];
        return Array.isArray(lookupOptions) ? lookupOptions : [lookupOptions];
    }

    /**
     * @description Extract field values từ nested paths, hỗ trợ array.
     */
    protected extractFieldValues(document: any, path?: string): any[] {
        if (!document || !path) return [];

        const parts = path.split('.');
        const values: any[] = [];

        const collect = (obj: any, idx: number): void => {
            if (obj === undefined || obj === null) return;

            if (idx === parts.length) {
                if (Array.isArray(obj)) {
                    values.push(...obj.filter(Boolean));
                } else if (obj) {
                    values.push(obj);
                }
                return;
            }

            if (Array.isArray(obj)) {
                obj.forEach(item => collect(item, idx));
                return;
            }

            collect(obj[parts[idx]], idx + 1);
        };

        collect(document, 0);

        return values.filter((item): item is NonNullable<typeof item> => item !== null);
    }

    /**
     * @description Tạo pipeline chính: match, sắp xếp, phân trang, select.
     */
    protected buildFindAllPipeline(
        find: Record<string, any> | undefined,
        options: IDatabaseFindAllOptions | undefined,
        fieldName?: string
    ): { pipeline: PipelineStage[]; hasLookupOrder: boolean } {
        fieldName = this.resolveFieldName(fieldName);
        let isPagingWithLastTime = false;
        const pipeline: PipelineStage[] = [
            {
                $match: {
                    ...find,
                    deleted: options?.withDeleted ?? false,
                },
            },
        ];

        if (
            options?.paging?.lastTime &&
            (this.isDefaultOrder(options?.order) || !options?.order)
        ) {
            isPagingWithLastTime = true;
            pipeline.push({
                $match: {
                    updatedAt: { $lt: new Date(options.paging.lastTime) },
                },
            });
        }

        let hasLookupOrder = false;
        if (options?.order) {
            const orderEntries = Object.entries(options.order);
            const directOrder: Record<string, any> = {};

            for (const [key, value] of orderEntries) {
                if (key.includes('.')) {
                    hasLookupOrder = true;
                } else {
                    directOrder[key] = value;
                }
            }

            if (Object.keys(directOrder).length > 0) {
                pipeline.push({ $sort: directOrder });
            }
        }

        if (!hasLookupOrder) {
            if (options?.paging?.offset && !isPagingWithLastTime) {
                pipeline.push({ $skip: options.paging.offset ?? 0 });
            }

            if (options?.paging?.limit) {
                pipeline.push({ $limit: options.paging.limit });
            }
        }

        if (
            options?.select &&
            typeof options.select === 'object' &&
            Object.keys(options.select).length > 0
        ) {
            pipeline.push({ $project: options.select });
        }

        pipeline.push({
            $group: {
                _id: null,
                [fieldName]: { $push: '$$ROOT' },
            },
        });

        pipeline.push({ $project: { _id: 0 } });

        return { pipeline, hasLookupOrder };
    }

    /**
     * @description Thực thi pipeline aggregate và trả về bucket kết quả.
     */
    protected async executeFindAllPipeline(
        pipeline: PipelineStage[],
        options: IDatabaseFindAllOptions | undefined,
        fieldName?: string
    ): Promise<Record<string, any>> {
        fieldName = this.resolveFieldName(fieldName);
        const mainAggregation = options?.session
            ? this._repository.aggregate(pipeline).session(options.session)
            : this._repository.aggregate(pipeline);

        const mainResult = await mainAggregation.exec();
        return mainResult.length > 0 ? mainResult[0] : { [fieldName]: [] };
    }

    /**
     * @description Sắp xếp kết quả theo field lookup sau khi đã resolve lookup.
     */
    protected sortLookupOrders(
        result: Record<string, any>,
        lookups: ILookupOption[],
        options: IDatabaseFindAllOptions | undefined,
        fieldName?: string
    ): void {
        fieldName = this.resolveFieldName(fieldName);
        const orderEntries = options?.order
            ? Object.entries(options.order)
            : [];
        if (
            !orderEntries.some(([key]) => key.includes('.')) ||
            !Array.isArray(result[fieldName])
        ) {
            return;
        }

        const docs: any[] = result[fieldName];
        const lookupOrder = orderEntries.find(([key]) => key.includes('.'));
        if (!lookupOrder) return;

        const [orderKey, directionRaw] = lookupOrder;
        const [alias, ...fieldParts] = orderKey.split('.');
        if (!alias || !fieldParts.length) return;

        const lookup = lookups.find(l => l.as === alias);
        if (!lookup) return;

        const targetField = fieldParts.join('.');
        const lookupDocs: any[] = Array.isArray(result[lookup.as])
            ? result[lookup.as]
            : [];

        const getNestedValue = (obj: any, path: string): any =>
            path.split('.').reduce((acc, key) => {
                if (acc === undefined || acc === null) return undefined;
                return acc[key];
            }, obj);

        const getter = (doc: any) => {
            if (lookup.useLookupAsSource) {
                const sourceLookup = lookups.find(
                    l => l.as === lookup.useLookupAsSource
                );
                if (!sourceLookup?.localField) return undefined;

                const sourceDocs: any[] = Array.isArray(result[sourceLookup.as])
                    ? result[sourceLookup.as]
                    : [];

                const sourceLocalValue = doc[sourceLookup.localField];
                const sourceLocalIds = Array.isArray(sourceLocalValue)
                    ? sourceLocalValue
                    : sourceLocalValue
                      ? [sourceLocalValue]
                      : [];
                if (!sourceLocalIds.length) return undefined;

                const targetId = sourceLocalIds
                    .map(sourceLocalId =>
                        sourceDocs.find(
                            sdoc =>
                                sdoc[
                                    sourceLookup.foreignField
                                ]?.toString?.() === sourceLocalId?.toString?.()
                        )
                    )
                    .filter(Boolean)
                    .map(
                        matched =>
                            matched?.[lookup.sourceField || lookup.foreignField]
                    )
                    .find(Boolean);

                if (!targetId) return undefined;

                const matched = lookupDocs.find(
                    ldoc =>
                        ldoc[lookup.foreignField]?.toString?.() ===
                        targetId?.toString?.()
                );
                return matched
                    ? getNestedValue(matched, targetField)
                    : undefined;
            }

            const localValue = lookup.localField
                ? doc[lookup.localField]
                : undefined;
            const localId = Array.isArray(localValue)
                ? localValue[0]
                : localValue;
            if (!localId) return undefined;

            const matched = lookupDocs.find(
                ldoc =>
                    ldoc[lookup.foreignField]?.toString?.() ===
                    localId?.toString?.()
            );

            return matched ? getNestedValue(matched, targetField) : undefined;
        };

        const direction =
            directionRaw === ENUM_PAGINATION_ORDER_DIRECTION_TYPE.ASC ? 1 : -1;

        docs.sort((a, b) => this.compareLookupValue(a, b, direction, getter));
        result[fieldName] = docs;
    }

    /**
     * @description Áp dụng phân trang khi sắp xếp theo field lookup (sau sort).
     */
    protected applyPostLookupPagination(
        result: Record<string, any>,
        options: IDatabaseFindAllOptions | undefined,
        hasLookupOrder: boolean,
        fieldName?: string
    ): void {
        fieldName = this.resolveFieldName(fieldName);
        if (!hasLookupOrder || !options?.paging) return;

        const docs: any[] = result[fieldName] || [];
        const offset = options.paging.offset || 0;
        const limit = options.paging.limit;

        if (limit) {
            result[fieldName] = docs.slice(offset, offset + limit);
        } else if (offset > 0) {
            result[fieldName] = docs.slice(offset);
        }
    }

    /**
     * @description Find detail với lookup - V4
     */
    async findDetailWithLookupV4<T = any>(
        find?: Record<string, any>,
        lookupOptions?: ILookupOption | ILookupOption[],
        options?: IDatabaseFindAllOptions,
        fieldName?: string
    ): Promise<T | null> {
        fieldName = this.resolveFieldName(fieldName);
        const lookups = Array.isArray(lookupOptions)
            ? lookupOptions
            : lookupOptions
              ? [lookupOptions]
              : [];

        const pipeline: PipelineStage[] = [];

        // Tách find thành direct search và lookup search
        const { directFind, lookupSearches } = this.parseFindForLookup(
            find,
            lookups
        );

        // Xây dựng pipeline cơ bản
        pipeline.push({
            $match: {
                ...directFind,
                deleted: options?.withDeleted ?? false,
            },
        });

        pipeline.push({ $limit: 1 });

        if (
            options?.select &&
            typeof options.select === 'object' &&
            Object.keys(options.select).length > 0
        ) {
            pipeline.push({ $project: options.select });
        }

        // Wrap document vào fieldName để dễ xử lý lookup
        pipeline.push({
            $group: {
                _id: null,
                [fieldName]: { $push: '$$ROOT' },
            },
        });

        if (lookups.length > 0) {
            const { leveledLookups } = this.buildLookupLevels(lookups);
            const lookupOrdersMap = this.extractLookupOrdersFromOptions(
                lookups,
                options
            );

            // Xây dựng lookups
            this.buildLookupsV4(
                pipeline,
                leveledLookups,
                lookupOrdersMap,
                fieldName
            );

            // Lọc lookup searches
            if (lookupSearches && Object.keys(lookupSearches).length > 0) {
                this.buildLookupSearchFilterV4(
                    pipeline,
                    lookups,
                    lookupSearches,
                    fieldName
                );
            }

            this.buildFilterStageV4(pipeline, lookups, fieldName);

            // Gộp các lookup vào field chính
            this.buildMergeToFieldStageV4(pipeline, lookups);
        }

        pipeline.push({ $project: { _id: 0 } });

        const aggregation = options?.session
            ? this._repository.aggregate(pipeline).session(options.session)
            : this._repository.aggregate(pipeline);

        const result = await aggregation.exec();

        if (!result.length || !result[0][fieldName]?.length) {
            return null;
        }

        return result[0] as T;
    }

    async findDetailWithLookup<T = any>(
        find?: Record<string, any>,
        lookupOptions?: ILookupOption | ILookupOption[],
        options?: IDatabaseFindAllOptions,
        fieldName?: string
    ): Promise<T | null> {
        fieldName = this.resolveFieldName(fieldName);
        const mainPipeline: PipelineStage[] = [
            {
                $match: {
                    ...find,
                    deleted: options?.withDeleted ?? false,
                },
            },
            { $limit: 1 },
        ];

        if (
            options?.select &&
            typeof options.select === 'object' &&
            Object.keys(options.select).length > 0
        ) {
            mainPipeline.push({ $project: options.select });
        }

        const mainAggregation = options?.session
            ? this._repository.aggregate(mainPipeline).session(options.session)
            : this._repository.aggregate(mainPipeline);

        const mainResult = await mainAggregation.exec();

        if (!mainResult.length) {
            return null;
        }

        const document = mainResult[0];
        const result = { [fieldName]: document };

        if (lookupOptions) {
            await this.processDetailLookups(
                result,
                fieldName,
                lookupOptions,
                options
            );
        }

        return result as T;
    }

    protected async processLookups(
        result: Record<string, any>,
        fieldName: string,
        lookupOptions: ILookupOption | ILookupOption[],
        options?: IDatabaseFindAllOptions
    ): Promise<void> {
        const lookups = Array.isArray(lookupOptions)
            ? lookupOptions
            : [lookupOptions];

        for (const lookup of lookups) {
            if (!lookup.localField) {
                result[lookup.as] = [];
                continue;
            }

            const localFieldValues = result[fieldName]
                .flatMap((doc: any) => {
                    const value = doc[lookup.localField!];
                    return Array.isArray(value) ? value : [value];
                })
                .filter((item): item is NonNullable<typeof item> => item !== null);

            if (localFieldValues.length === 0) {
                // Không có giá trị để join => không có parent nào hợp lệ
                result[lookup.as] = [];
                continue;
            }

            const lookupPipeline = [
                {
                    $match: {
                        [lookup.foreignField]: { $in: localFieldValues },
                        ...(lookup.matchLookup ? lookup.matchLookup : {}),
                    },
                },
                {
                    $group: {
                        _id: null,
                        items: { $addToSet: '$$ROOT' },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        items: 1,
                    },
                },
            ];

            const lookupResults = await this._repository.db
                .collection(lookup.from)
                .aggregate(
                    lookupPipeline,
                    options?.session ? { session: options.session } : {}
                )
                .toArray();

            const parentDocument: any[] = result[fieldName];
            const matchedItems =
                lookupResults.length > 0 ? lookupResults[0].items : [];
            result[lookup.as] = matchedItems;
            // Giữ lại các parent có liên kết qua localField và foreignField
            if (lookup.matchLookup) {
                if (
                    Array.isArray(parentDocument) &&
                    parentDocument.length > 0
                ) {
                    const matchedKeys = new Set(
                        matchedItems.map(it => it[lookup.foreignField])
                    );
                    // Nếu không có child nào match, giữ nguyên tập cha
                    const hasMatch = (doc: any) => {
                        const val = doc[lookup.localField!];
                        return Array.isArray(val)
                            ? val.some(v => matchedKeys.has(v))
                            : matchedKeys.has(val);
                    };
                    result[fieldName] = parentDocument.filter(hasMatch);
                }
            }
        }
    }

    private compareLookupValue(
        a: any,
        b: any,
        direction: number,
        getter: (doc: any) => any
    ): number {
        const va = getter(a);
        const vb = getter(b);
        if (va === vb) return 0;
        if (va === undefined || va === null) return 1 * direction * -1;
        if (vb === undefined || vb === null) return -1 * direction * -1;
        if (typeof va === 'string' && typeof vb === 'string') {
            return va.localeCompare(vb) * direction;
        }
        return (va < vb ? -1 : 1) * direction;
    }

    protected async processDetailLookups(
        result: Record<string, any>,
        fieldName: string,
        lookupOptions: ILookupOption | ILookupOption[],
        options?: IDatabaseFindAllOptions
    ): Promise<void> {
        const lookups = Array.isArray(lookupOptions)
            ? lookupOptions
            : [lookupOptions];
        const document = result[fieldName];

        for (const lookup of lookups) {
            if (!lookup.localField) {
                result[lookup.as] = [];
                continue;
            }

            const value = document[lookup.localField];
            const localFieldValues = Array.isArray(value)
                ? value.filter(Boolean)
                : value
                  ? [value]
                  : [];

            if (localFieldValues.length === 0) {
                result[lookup.as] = [];
                continue;
            }

            const lookupPipeline = [
                {
                    $match: {
                        [lookup.foreignField]: { $in: localFieldValues },
                        deleted: false,
                    },
                },
            ];

            const lookupResults = await this._repository.db
                .collection(lookup.from)
                .aggregate(
                    lookupPipeline,
                    options?.session ? { session: options.session } : {}
                )
                .toArray();

            result[lookup.as] = lookupResults;
        }
    }

    protected resolveFieldName(fieldName?: string): string {
        return fieldName ?? 'data';
    }
}
