import type { Request } from 'express';

export interface IRequestWithContext extends Request {
  __language?: string;
  __version?: string;
  requestId?: string;
}
