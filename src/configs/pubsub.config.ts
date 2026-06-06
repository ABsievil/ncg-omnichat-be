import { registerAs } from '@nestjs/config';

export default registerAs('pubsub', () => ({
    enabled: process.env.PUBSUB_ENABLED === 'true',
    projectId:
        process.env.PUBSUB_PROJECT_ID ??
        process.env.FIREBASE_PROJECT_ID ??
        '',
}));
