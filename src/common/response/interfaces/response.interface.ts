import type { IResponseMetadata } from 'src/app/interfaces/app.interface';

export interface IResponse<T> {
  data: T;
  _metadata?: IResponseMetadata;
}

export interface IResponsePaging<T> {
  data: T[];
  _pagination: { total: number; totalPage: number };
  _metadata?: IResponseMetadata;
}

export interface IResponseLookupPaging<T> {
  data: T;
  _pagination: { total: number; totalPage: number };
  _metadata?: IResponseMetadata;
}
