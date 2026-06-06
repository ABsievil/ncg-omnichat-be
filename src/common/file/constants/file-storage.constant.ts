export const FILE_STORAGE_CONFIG_PATH = {
    FIREBASE: {
        PROJECT_ID: 'firebase.projectId',
        CLIENT_EMAIL: 'firebase.clientEmail',
        PRIVATE_KEY: 'firebase.privateKey',
        STORAGE_BUCKET: 'firebase.storageBucket',
        STORAGE_BUCKET_URL: 'firebase.storageBucketUrl',
    },
    R2: {
        ACCESS_KEY_ID: 'r2.accessKeyId',
        SECRET_ACCESS_KEY: 'r2.secretAccessKey',
        ENDPOINT: 'r2.endpoint',
        BUCKET: 'r2.bucket',
        PUBLIC_ENDPOINT: 'r2.publicEndpoint',
    },
} as const;

export const FILE_STORAGE_DEFAULTS = {
    UPLOAD_PATH: 'uploads',
    PATH_PREFIX: 'uploads',
    CHUNK_SIZE_BYTES: 5 * 1024 * 1024,
    PARALLEL_BATCH_SIZE: 5,
} as const;
