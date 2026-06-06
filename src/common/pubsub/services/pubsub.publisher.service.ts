import { PubSub, type Topic } from '@google-cloud/pubsub';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
    PUBSUB_CLIENT_NAME,
    PUBSUB_DEFAULT_RETRY,
} from 'src/common/pubsub/constants/pubsub.constant';
import {
    IPubSubPublishOptions,
    IPubSubPublishRetryOptions,
} from 'src/common/pubsub/interfaces/pubsub.interface';

@Injectable()
export class PubSubPublisherService {
    private readonly logger = new Logger(PubSubPublisherService.name);
    private readonly topicCache = new Map<string, Topic>();

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

    private async resolveTopic(topicName: string): Promise<Topic> {
        const cached = this.topicCache.get(topicName);
        if (cached) {
            return cached;
        }

        const client = this.assertClient();
        const topic = client.topic(topicName);
        const [topicExists] = await topic.exists();

        if (!topicExists) {
            await client.createTopic(topicName);
        }

        this.topicCache.set(topicName, topic);
        return topic;
    }

    private async executeWithRetry<T>(
        operation: () => Promise<T>,
        topicName: string,
        retryOptions?: IPubSubPublishRetryOptions,
    ): Promise<T> {
        const maxRetries =
            retryOptions?.maxRetries ?? PUBSUB_DEFAULT_RETRY.MAX_RETRIES;
        const retryDelayMs =
            retryOptions?.retryDelayMs ?? PUBSUB_DEFAULT_RETRY.DELAY_MS;

        let lastError: Error | undefined;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError =
                    error instanceof Error ? error : new Error(String(error));
                const isLastAttempt = attempt === maxRetries - 1;

                if (isLastAttempt) {
                    this.logger.error(
                        `PubSub publish failed for topic '${topicName}' after ${maxRetries} attempts: ${lastError.message}`,
                        lastError.stack,
                    );
                    throw lastError;
                }

                this.logger.warn(
                    `PubSub publish attempt ${attempt + 1}/${maxRetries} failed for topic '${topicName}': ${lastError.message}`,
                );
                await new Promise(resolve => setTimeout(resolve, retryDelayMs));
            }
        }

        throw lastError ?? new Error('PubSub publish failed');
    }

    async publish(
        topicName: string,
        data: Record<string, unknown>,
        options?: IPubSubPublishOptions & {
            retryOptions?: IPubSubPublishRetryOptions;
        },
    ): Promise<string> {
        const topic = await this.resolveTopic(topicName);
        const dataBuffer = Buffer.from(JSON.stringify(data));

        return this.executeWithRetry(
            () => topic.publish(dataBuffer, options?.attributes),
            topicName,
            options?.retryOptions,
        );
    }

    async publishBatch(
        topicName: string,
        messages: Array<{
            data: Record<string, unknown>;
            attributes?: Record<string, string>;
        }>,
        options?: { retryOptions?: IPubSubPublishRetryOptions },
    ): Promise<string[]> {
        if (!messages.length) {
            return [];
        }

        const topic = await this.resolveTopic(topicName);
        const pubsubMessages = messages.map(message => ({
            data: Buffer.from(JSON.stringify(message.data)),
            attributes: message.attributes ?? {},
        }));

        return this.executeWithRetry(
            () =>
                Promise.all(
                    pubsubMessages.map(message =>
                        topic.publishMessage(message),
                    ),
                ),
            topicName,
            options?.retryOptions,
        );
    }
}
