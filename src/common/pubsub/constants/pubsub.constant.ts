export const PUBSUB_CLIENT_NAME = 'PUBSUB_CLIENT';

export const PUBSUB_CONFIG_PATH = {
    ENABLED: 'pubsub.enabled',
    PROJECT_ID: 'pubsub.projectId',
    FIREBASE_CLIENT_EMAIL: 'firebase.clientEmail',
    FIREBASE_PRIVATE_KEY: 'firebase.privateKey',
} as const;

export const PUBSUB_DEFAULT_RETRY = {
    MAX_RETRIES: 2,
    DELAY_MS: 1000,
} as const;

export const PUBSUB_DEFAULT_FLOW_CONTROL = {
    MAX_MESSAGES: 10,
    ALLOW_EXCESS_MESSAGES: false,
} as const;
