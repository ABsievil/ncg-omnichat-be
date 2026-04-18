export const ERROR_RESPONSE_DEFAULT = {
  LANGUAGE: 'en',
  TIMEZONE: 'UTC',
  API_PREFIX: 'api',
  API_VERSION: '1',
  RELEASE: '0.0.1',
} as const;

export const APP_CONFIG_KEY = {
  API_PREFIX: 'app.apiPrefix',
  API_VERSION: 'app.apiVersion',
  RELEASE: 'app.release',
  ENV: 'app.env',
} as const;
