import type { Request } from 'express';
import type { IPaginationRequestMetadata } from 'src/common/pagination/interfaces/pagination.interface';

export interface IRequestApp<T = any> extends Request {
    user?: T;

    __user?: any;
    __language: string;
    __version: string;
    requestId?: string;

    __pagination?: IPaginationRequestMetadata;
}
