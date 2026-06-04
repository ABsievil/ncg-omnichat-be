import { PubSub } from '@google-cloud/pubsub';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PUBSUB_CLIENT_NAME } from 'src/common/pubsub/constants/pubsub.constant';
import { IPubSubPublishOptions } from 'src/common/pubsub/interfaces/pubsub.interface';

@Injectable()
export class PubSubPublisherService {
    private readonly logger = new Logger(PubSubPublisherService.name);
    private readonly topicCache: Map<string, any> = new Map();

    constructor(
        @Inject(PUBSUB_CLIENT_NAME) private readonly pubSubClient: PubSub
    ) {}

    /**
     * @description Gửi một tin nhắn đến một chủ đề với options thử lại
     */
    async publish(
        topicName: string,
        data: Record<string, any>,
        options?: IPubSubPublishOptions & {
            retryOptions?: {
                maxRetries?: number;
                retryDelay?: number;
            };
        }
    ): Promise<string> {
        // this.logger.debug(`Publishing to topic '${topicName}'`);

        const maxRetries = options?.retryOptions?.maxRetries || 2;
        const retryDelay = options?.retryOptions?.retryDelay || 1000;

        // Lấy hoặc tạo chủ đề
        let topic = this.topicCache.get(topicName);

        if (!topic) {
            const [topicExists] = await this.pubSubClient
                .topic(topicName)
                .exists();

            if (!topicExists) {
                await this.pubSubClient.createTopic(topicName);
            }

            topic = this.pubSubClient.topic(topicName);
            this.topicCache.set(topicName, topic);
        }

        // Chuyển đổi dữ liệu thành Buffer
        const dataBuffer = Buffer.from(JSON.stringify(data));

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // Gửi tin nhắn đến chủ đề
                const messageId = await topic.publish(
                    dataBuffer,
                    options?.attributes
                );

                console.log(
                    `Message ${messageId} published to topic '${topicName}'`
                );
                return messageId;
            } catch (error) {
                const isLastAttempt = attempt === maxRetries - 1;

                if (isLastAttempt) {
                    this.logger.error(
                        `Failed to publish to topic '${topicName}' after ${maxRetries} attempts: ${error.message}`,
                        error.stack
                    );
                    throw error;
                }

                this.logger.warn(
                    `Attempt ${attempt + 1}/${maxRetries} failed for topic '${topicName}': ${error.message}. Retrying in ${retryDelay}ms...`
                );

                // Chờ trước khi thử lại
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }

    /**
     * @description Gửi nhiều tin nhắn đến một chủ đề theo lô
     */
    async publishBatch(
        topicName: string,
        messages: Array<{
            data: Record<string, any>;
            attributes?: Record<string, string>;
        }>,
        options?: {
            retryOptions?: {
                maxRetries?: number;
                retryDelay?: number;
            };
        }
    ): Promise<string[]> {
        if (!messages.length) {
            return [];
        }

        // this.logger.debug(
        //     `Batch publishing ${messages.length} messages to topic '${topicName}'`
        // );

        const maxRetries = options?.retryOptions?.maxRetries || 2;
        const retryDelay = options?.retryOptions?.retryDelay || 1000;

        // Lấy hoặc tạo chủ đề
        let topic = this.topicCache.get(topicName);

        if (!topic) {
            const [topicExists] = await this.pubSubClient
                .topic(topicName)
                .exists();

            if (!topicExists) {
                await this.pubSubClient.createTopic(topicName);
            }

            topic = this.pubSubClient.topic(topicName);
            this.topicCache.set(topicName, topic);
        }

        const pubsubMessages = messages.map(message => ({
            data: Buffer.from(JSON.stringify(message.data)),
            attributes: message.attributes || {},
        }));

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // Gửi tin nhắn theo lô
                const messageIds = await topic.publishMessage(pubsubMessages);

                return messageIds;
            } catch (error) {
                const isLastAttempt = attempt === maxRetries - 1;

                if (isLastAttempt) {
                    this.logger.error(
                        `Failed to batch publish to topic '${topicName}' after ${maxRetries} attempts: ${error.message}`,
                        error.stack
                    );
                    throw error;
                }

                // this.logger.warn(
                //     `Batch publish attempt ${attempt + 1}/${maxRetries} failed for topic '${topicName}': ${error.message}. Retrying in ${retryDelay}ms...`
                // );

                // Chờ trước khi thử lại
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }
}
