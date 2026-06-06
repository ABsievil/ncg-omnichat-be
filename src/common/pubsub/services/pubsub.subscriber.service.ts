import { PubSub, type Subscription } from '@google-cloud/pubsub';
import {
    Inject,
    Injectable,
    Logger,
    OnApplicationShutdown,
} from '@nestjs/common';
import {
    PUBSUB_CLIENT_NAME,
    PUBSUB_DEFAULT_FLOW_CONTROL,
} from 'src/common/pubsub/constants/pubsub.constant';
import {
    IPubSubMessage,
    IPubSubSubscribeOptions,
} from 'src/common/pubsub/interfaces/pubsub.interface';

@Injectable()
export class PubSubSubscriberService implements OnApplicationShutdown {
    private readonly logger = new Logger(PubSubSubscriberService.name);
    private readonly activeSubscriptions = new Map<string, Subscription>();

    constructor(
        @Inject(PUBSUB_CLIENT_NAME)
        private readonly pubSubClient: PubSub | null,
    ) {}

    private assertClient(): PubSub {
        if (!this.pubSubClient) {
            throw new Error('PubSub client is not available');
        }

        return this.pubSubClient;
    }

    async subscribe(
        subscriptionName: string,
        handler: (message: IPubSubMessage) => Promise<void>,
        options: IPubSubSubscribeOptions = {},
    ): Promise<void> {
        if (this.activeSubscriptions.has(subscriptionName)) {
            return;
        }

        const client = this.assertClient();
        const subscription = client.subscription(subscriptionName, {
            flowControl: {
                maxMessages:
                    options.flowControl?.maxMessages ??
                    PUBSUB_DEFAULT_FLOW_CONTROL.MAX_MESSAGES,
                allowExcessMessages:
                    options.flowControl?.allowExcessMessages ??
                    PUBSUB_DEFAULT_FLOW_CONTROL.ALLOW_EXCESS_MESSAGES,
            },
        });

        subscription.on('message', async message => {
            try {
                await handler({
                    id: message.id,
                    data: message.data,
                    attributes: message.attributes,
                    publishTime: message.publishTime,
                });
                message.ack();
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : String(error);
                this.logger.error(
                    `Failed to process PubSub message from '${subscriptionName}': ${errorMessage}`,
                    error instanceof Error ? error.stack : undefined,
                );
                message.nack();
            }
        });

        subscription.on('error', error => {
            this.logger.error(
                `PubSub subscription error '${subscriptionName}': ${error.message}`,
                error.stack,
            );
        });

        this.activeSubscriptions.set(subscriptionName, subscription);
    }

    async unsubscribe(subscriptionName: string): Promise<void> {
        const subscription = this.activeSubscriptions.get(subscriptionName);

        if (!subscription) {
            return;
        }

        await subscription.close();
        this.activeSubscriptions.delete(subscriptionName);
    }

    isSubscribed(subscriptionName: string): boolean {
        return this.activeSubscriptions.has(subscriptionName);
    }

    getActiveSubscriptions(): string[] {
        return Array.from(this.activeSubscriptions.keys());
    }

    async onApplicationShutdown(): Promise<void> {
        const subscriptions = Array.from(this.activeSubscriptions.entries());

        for (const [name, subscription] of subscriptions) {
            try {
                await subscription.close();
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error);
                this.logger.error(
                    `Error closing PubSub subscription '${name}': ${message}`,
                );
            }
        }

        this.activeSubscriptions.clear();
    }
}
