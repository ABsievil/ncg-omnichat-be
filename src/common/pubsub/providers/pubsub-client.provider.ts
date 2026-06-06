import { PubSub } from '@google-cloud/pubsub';
import { Logger, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    PUBSUB_CLIENT_NAME,
    PUBSUB_CONFIG_PATH,
} from 'src/common/pubsub/constants/pubsub.constant';

const logger = new Logger('PubSubClientProvider');

export const pubSubClientProvider: Provider = {
    provide: PUBSUB_CLIENT_NAME,
    inject: [ConfigService],
    useFactory: (configService: ConfigService): PubSub | null => {
        const enabled = configService.get<boolean>(
            PUBSUB_CONFIG_PATH.ENABLED,
        );

        if (!enabled) {
            logger.log('PubSub is disabled');
            return null;
        }

        const projectId = configService.get<string>(
            PUBSUB_CONFIG_PATH.PROJECT_ID,
        );
        const clientEmail = configService.get<string>(
            PUBSUB_CONFIG_PATH.FIREBASE_CLIENT_EMAIL,
        );
        const privateKey = configService.get<string>(
            PUBSUB_CONFIG_PATH.FIREBASE_PRIVATE_KEY,
        );

        if (!projectId || !clientEmail || !privateKey) {
            logger.warn(
                'PubSub is enabled but credentials are incomplete. Client will not be created.',
            );
            return null;
        }

        try {
            return new PubSub({
                projectId,
                credentials: {
                    client_email: clientEmail,
                    private_key: privateKey.includes('\\n')
                        ? privateKey.replace(/\\n/g, '\n')
                        : privateKey,
                },
            });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            logger.error(`Failed to create PubSub client: ${message}`);
            return null;
        }
    },
};
