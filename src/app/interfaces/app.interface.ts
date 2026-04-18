import type { ValidationError } from 'class-validator';

export interface IResponseMetadata {
  language?: string;
  timestamp?: string;
  timezone?: string;
  path?: string;
  version?: string;
  release?: string;
  repoVersion?: string;
  pagination?: Record<string, unknown>;
  customProperty?: {
    statusCode?: number;
    message?: string;
    httpStatus?: number;
    messageProperties?: Record<string, unknown>;
  };
}

export type AppExceptionErrors =
  | ValidationError[]
  | Record<string, unknown>[];

export interface IAppException {
  statusCode: number;
  errorCode?: number;
  message: string;
  errors?: AppExceptionErrors;
  data?: Record<string, unknown>;
  _metadata?: IResponseMetadata;
}
