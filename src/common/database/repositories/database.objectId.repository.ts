import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import {
    BulkWriteResult,
    DeleteResult,
    InsertManyResult,
    UpdateResult,
} from 'mongodb';
import {
    FilterQuery,
    Model,
    PipelineStage,
    PopulateOptions,
    UpdateQuery,
    UpdateWithAggregationPipeline,
} from 'mongoose';
import { DatabaseObjectIdEntityBase } from 'src/common/database/bases/database.objectId.entity';
import {
    DATABASE_AUDIT_FIELD.APPROVED_AT,
    DATABASE_AUDIT_FIELD.APPROVED_BY,
    DATABASE_AUDIT_FIELD.BRANCH_ID,
    DATABASE_AUDIT_FIELD.CREATED_BY,
    DATABASE_AUDIT_FIELD.DELETED,
    DATABASE_AUDIT_FIELD.DELETED_AT,
    DATABASE_AUDIT_FIELD.DELETED_BY,
    DATABASE_AUDIT_FIELD.LOOKUP_CODE,
    DATABASE_AUDIT_FIELD.UPDATED_BY,
} from 'src/common/database/constants/database.constant';
import {
    IDatabaseAggregateOptions,
    IDatabaseBulkWriteOptions,
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
import { LookupCodeService } from 'src/modules/lookup-code/services/lookup-code.service';

export abstract class DatabaseObjectIdRepositoryBase<
    Entity extends DatabaseObjectIdEntityBase,
    EntityDocument extends IDatabaseDocument<Entity>,
> {
    protected readonly _repository: Model<Entity>;
    readonly _join?: PopulateOptions | (string | PopulateOptions)[];
    protected _enableLookupCode: boolean;

    @Inject(LookupCodeService)
    private readonly _lookupCodeService: LookupCodeService;
    @Inject(REQUEST) public readonly _request: Request;

    constructor(
        repository: Model<Entity>,
        options?: PopulateOptions | (string | PopulateOptions)[],
        enableLookupCode: boolean = false
    ) {
        this._repository = repository;
        this._join = options;
        this._enableLookupCode = enableLookupCode;
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
        return user.id;
    }

    protected async withTransaction<T>(
        callback: (session: any) => Promise<T>
    ): Promise<T> {
        const session = await this._repository.db.startSession();

        try {
            const result = await session.withTransaction(() =>
                callback(session)
            );
            return result;
        } finally {
            await session.endSession();
        }
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
        let isPagingWithLastTime = false;
        const repository = this._repository.find<T>({
            ...find,
            deleted: options?.withDeleted ?? false,
        });

        if (options?.collation) {
            repository.collation(options.collation);
        }

        if (
            options?.paging?.lastTime &&
            (this.isDefaultOrder(options?.order) || !options?.order)
        ) {
            isPagingWithLastTime = true;
            repository
                .where('updatedAt')
                .lt(new Date(options.paging.lastTime) as any);
        }

        if (options?.select) {
            repository.select(options.select);
        }

        if (options?.paging?.offset && !isPagingWithLastTime) {
            repository.skip(options.paging.offset);
        }

        if (options?.paging?.limit) {
            repository.limit(options.paging.limit);
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

        return repository.exec();
    }

    async findOne<T = EntityDocument>(
        find: Record<string, any>,
        options?: IDatabaseFindOneOptions
    ): Promise<T> {
        const repository = this._repository.findOne<T>({
            ...find,
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

        return repository.exec();
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

        return repository.exec();
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

        return repository.exec();
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

        return repository.exec();
    }

    async getTotal(
        find?: Record<string, any>,
        options?: IDatabaseGetTotalOptions
    ): Promise<number> {
        const repository = this._repository.countDocuments({
            ...find,
            ...this.buildDeletedFilter(options),
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
        if (this._enableLookupCode) {
            const prefix = this._lookupCodeService.getPrefixFromEntityName(
                this._repository.modelName
            );
            data[DATABASE_AUDIT_FIELD.LOOKUP_CODE] =
                await this._lookupCodeService.generateCode(
                    data[DATABASE_AUDIT_FIELD.BRANCH_ID],
                    prefix
                );
        }
        data[DATABASE_AUDIT_FIELD.CREATED_BY] = this.getCurrentUserId();
        const created = await this._repository.create([data], options);

        return created[0] as any;
    }

    // Action
    async update(
        find: Record<string, any>,
        data: UpdateQuery<Entity> | UpdateWithAggregationPipeline,
        options?: IDatabaseUpdateOptions
    ): Promise<EntityDocument> {
        data[DATABASE_AUDIT_FIELD.UPDATED_BY] = this.getCurrentUserId();
        return this._repository.findOneAndUpdate(
            {
                ...find,
                ...this.buildDeletedFilter(options),
            },
            data,
            {
                ...options,
                new: true,
            }
        );
    }

    async upsert(
        find: Record<string, any>,
        data: UpdateQuery<Entity> | UpdateWithAggregationPipeline,
        byType?: string,
        options?: IDatabaseUpdateOptions
    ): Promise<EntityDocument> {
        data[byType] = this.getCurrentUserId();
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
        );
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
        );
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
        );
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
        );
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
        if (!data?.length) {
            return { acknowledged: true, insertedCount: 0, insertedIds: {} };
        }

        const processedData = [...data];
        const currentUserId = this.getCurrentUserId();

        if (this._enableLookupCode) {
            const prefix = this._lookupCodeService.getPrefixFromEntityName(
                this._repository.modelName
            );
            const branchId = processedData[0][DATABASE_AUDIT_FIELD.BRANCH_ID];

            if (options?.session) {
                const codes = await Promise.all(
                    processedData.map(() =>
                        this._lookupCodeService.generateCode(branchId, prefix)
                    )
                );

                processedData.forEach((item, index) => {
                    item[DATABASE_AUDIT_FIELD.LOOKUP_CODE] = codes[index];
                    item[DATABASE_AUDIT_FIELD.CREATED_BY] = currentUserId;
                });
            } else {
                return this.withTransaction(async session => {
                    const codes = await Promise.all(
                        processedData.map(() =>
                            this._lookupCodeService.generateCode(
                                branchId,
                                prefix
                            )
                        )
                    );

                    processedData.forEach((item, index) => {
                        item[DATABASE_AUDIT_FIELD.LOOKUP_CODE] = codes[index];
                        item[DATABASE_AUDIT_FIELD.CREATED_BY] = currentUserId;
                    });

                    return this._repository.insertMany(processedData as any, {
                        ...options,
                        session,
                        rawResult: true,
                    });
                });
            }
        }

        processedData.forEach(item => {
            item[DATABASE_AUDIT_FIELD.CREATED_BY] = currentUserId;
        });

        return this._repository.insertMany(processedData as any, {
            ...options,
            rawResult: true,
        });
    }

    async createManyDocs<T = EntityDocument>(
        data: T[],
        options?: IDatabaseCreateManyOptions
    ): Promise<EntityDocument[]> {
        if (!data?.length) {
            return [];
        }

        const processedData = [...data];
        const currentUserId = this.getCurrentUserId();

        if (this._enableLookupCode) {
            const prefix = this._lookupCodeService.getPrefixFromEntityName(
                this._repository.modelName
            );
            const branchId = processedData[0][DATABASE_AUDIT_FIELD.BRANCH_ID];

            if (options?.session) {
                const codes = await Promise.all(
                    processedData.map(() =>
                        this._lookupCodeService.generateCode(branchId, prefix)
                    )
                );

                processedData.forEach((item, index) => {
                    item[DATABASE_AUDIT_FIELD.LOOKUP_CODE] = codes[index];
                    item[DATABASE_AUDIT_FIELD.CREATED_BY] = currentUserId;
                });
            } else {
                return this.withTransaction(async session => {
                    const codes = await Promise.all(
                        processedData.map(() =>
                            this._lookupCodeService.generateCode(
                                branchId,
                                prefix
                            )
                        )
                    );

                    processedData.forEach((item, index) => {
                        item[DATABASE_AUDIT_FIELD.LOOKUP_CODE] = codes[index];
                        item[DATABASE_AUDIT_FIELD.CREATED_BY] = currentUserId;
                    });

                    const result = await this._repository.insertMany(
                        processedData as any,
                        {
                            ...options,
                            session,
                            rawResult: false,
                        }
                    );
                    return result as EntityDocument[];
                });
            }
        }

        processedData.forEach(item => {
            item[DATABASE_AUDIT_FIELD.CREATED_BY] = currentUserId;
        });

        return this._repository.insertMany(processedData as any, {
            ...options,
            rawResult: false,
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
                $set: data,
            },
            { ...options, rawResult: true }
        );
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
            { ...options, rawResult: true }
        );
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
            { ...options, rawResult: true }
        );
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
            { ...options, rawResult: true }
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
            { ...options, rawResult: true }
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
            const keysOrder = Object.keys(options?.order);
            newPipelines.push({
                $sort: keysOrder.reduce(
                    (a, b) => ({
                        ...a,
                        [b]:
                            options?.order[b] ===
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
                    $limit: options.paging.limit + options.paging.offset,
                },
                { $skip: options.paging.offset }
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

    async findAllWithLookup<T = any>(
        find?: Record<string, any>,
        lookupOptions?: ILookupOption | ILookupOption[],
        options?: IDatabaseFindAllOptions,
        fieldName?: string
    ): Promise<T[]> {
        let isPagingWithLastTime = false;
        const mainPipeline: PipelineStage[] = [
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
            mainPipeline.push({
                $match: {
                    updatedAt: { $lt: new Date(options.paging.lastTime) },
                },
            });
        }

        if (options?.order) {
            mainPipeline.push({ $sort: options.order });
        }

        if (options?.paging?.offset && !isPagingWithLastTime) {
            mainPipeline.push({ $skip: options.paging.offset });
        }

        if (options?.paging?.limit) {
            mainPipeline.push({ $limit: options.paging.limit });
        }

        if (
            options?.select &&
            typeof options.select === 'object' &&
            Object.keys(options.select).length > 0
        ) {
            mainPipeline.push({ $project: options.select });
        }

        mainPipeline.push({
            $group: {
                _id: null,
                [fieldName]: { $push: '$$ROOT' },
            },
        });

        mainPipeline.push({
            $project: { _id: 0 },
        });

        const mainAggregation = options?.session
            ? this._repository.aggregate(mainPipeline).session(options.session)
            : this._repository.aggregate(mainPipeline);

        const mainResult = await mainAggregation.exec();
        const result =
            mainResult.length > 0 ? mainResult[0] : { [fieldName]: [] };

        if (lookupOptions) {
            await this.processLookups(
                result,
                fieldName,
                lookupOptions,
                options
            );
        }

        return [result] as T[];
    }

    async findDetailWithLookup<T = any>(
        find?: Record<string, any>,
        lookupOptions?: ILookupOption | ILookupOption[],
        options?: IDatabaseFindAllOptions,
        fieldName?: string
    ): Promise<T> {
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
            const localFieldValues = result[fieldName]
                .flatMap((doc: any) => {
                    const value = doc[lookup.localField];
                    return Array.isArray(value) ? value : [value];
                })
                .filter(Boolean);

            if (localFieldValues.length === 0) {
                result[lookup.as] = [];
                continue;
            }

            const lookupPipeline: PipelineStage[] = [
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

            result[lookup.as] =
                lookupResults.length > 0 ? lookupResults[0].items : [];
        }
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

    async bulkWrite(
        operations: any[],
        options?: IDatabaseBulkWriteOptions
    ): Promise<BulkWriteResult> {
        return this._repository.bulkWrite(operations, options);
    }

    private buildDeletedFilter(
        options?: IDatabaseOptions
    ): FilterQuery<Entity> {
        if (options?.withAvailableDataAndNotDeleted) {
            return {
                $or: [{ deleted: false }, { deleted: { $exists: false } }],
            } as FilterQuery<Entity>;
        }

        return {
            deleted: options?.withDeleted ?? false,
        } as FilterQuery<Entity>;
    }
}
