import { registerAs } from '@nestjs/config';
import {
  OMNICHAT_REQUEST_HEADER,
} from 'src/app/constants/omnichat-request-header.constant';

function parseCorsOrigin(
  raw: string | undefined,
): boolean | string | string[] {
  const isProduction = process.env.NODE_ENV === 'production';
  if (raw === undefined || raw === '' || raw === '*') {
    if (isProduction) {
      throw new Error('CORS_ORIGIN must be a whitelist in production, not *');
    }
    return true;
  }
  const trimmed = raw.trim();
  if (trimmed.startsWith('[')) {
    return JSON.parse(trimmed) as string[];
  }
  return trimmed.split(',').map((s) => s.trim());
}

export default registerAs('middleware', () => ({
  body: {
    json: {
      limit: process.env.MIDDLEWARE_BODY_JSON_LIMIT ?? '1mb',
    },
    urlencoded: {
      extended: false,
      limit: process.env.MIDDLEWARE_BODY_URLENCODED_LIMIT ?? '1mb',
    },
    raw: {
      limit: process.env.MIDDLEWARE_BODY_RAW_LIMIT ?? '1mb',
    },
    text: {
      limit: process.env.MIDDLEWARE_BODY_TEXT_LIMIT ?? '1mb',
    },
  },
  cors: {
    allowOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
    allowMethod: (process.env.CORS_METHODS ?? 'GET,HEAD,PUT,PATCH,POST,DELETE')
      .split(',')
      .map((s) => s.trim()),
    allowHeader: (
      process.env.CORS_HEADERS ??
      [
        'Content-Type',
        'Authorization',
        'Accept',
        'Cache-Control',
        'Accept-Language',
        'x-lang',
        OMNICHAT_REQUEST_HEADER.ClientId,
        OMNICHAT_REQUEST_HEADER.SessionId,
      ].join(',')
    )
      .split(',')
      .map((s) => s.trim()),
  },
  urlVersion: {
    resolveFromPath: process.env.MIDDLEWARE_URL_VERSION_FROM_PATH !== 'false',
  },
  responseTime: {
    headerName: process.env.MIDDLEWARE_RESPONSE_TIME_HEADER ?? 'x-response-time',
  },
  throttle: {
    ttl: Number.parseInt(
      process.env.MIDDLEWARE_THROTTLE_TTL_MS ?? '60000',
      10,
    ),
    limit: Number.parseInt(process.env.MIDDLEWARE_THROTTLE_LIMIT ?? '100', 10),
  },
  timeout: Number.parseInt(process.env.MIDDLEWARE_REQUEST_TIMEOUT_SEC ?? '30', 10),
}));
