export const MIDDLEWARE_CONFIG_PATH = {
  BODY_JSON_LIMIT: 'middleware.body.json.limit',
  BODY_URLENCODED_EXTENDED: 'middleware.body.urlencoded.extended',
  BODY_URLENCODED_LIMIT: 'middleware.body.urlencoded.limit',
  BODY_RAW_LIMIT: 'middleware.body.raw.limit',
  BODY_TEXT_LIMIT: 'middleware.body.text.limit',
  CORS_ALLOW_ORIGIN: 'middleware.cors.allowOrigin',
  CORS_ALLOW_METHOD: 'middleware.cors.allowMethod',
  CORS_ALLOW_HEADER: 'middleware.cors.allowHeader',
  URL_VERSION_FROM_PATH: 'middleware.urlVersion.resolveFromPath',
  RESPONSE_TIME_HEADER: 'middleware.responseTime.headerName',
  THROTTLE_TTL: 'middleware.throttle.ttl',
  THROTTLE_LIMIT: 'middleware.throttle.limit',
} as const;

export const MESSAGE_CONFIG_PATH = {
  DEFAULT_LANGUAGE: 'message.defaultLanguage',
  AVAILABLE_LANGUAGES: 'message.availableLanguages',
} as const;
