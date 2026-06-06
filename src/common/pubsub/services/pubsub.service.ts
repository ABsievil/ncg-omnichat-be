import { Injectable } from '@nestjs/common';
import {
    IPubSubMessage,
    IPubSubPublishOptions,
    IPubSubPublishRetryOptions,
    IPubSubSubscribeOptions,
} from 'src/common/pubsub/interfaces/pubsub.interface';
import { PubSubPublisherService } from 'src/common/pubsub/services/pubsub.publisher.service';
import { PubSubSubscriberService } from 'src/common/pubsub/services/pubsub.subscriber.service';

@Injectable()
export class PubSubService {
    constructor(
        private readonly publisherService: PubSubPublisherService,
        private readonly subscriberService: PubSubSubscriberService,
    ) {}

    async publish(
        topicName: string,
        data: Record<string, unknown>,
        options?: IPubSubPublishOptions & {
            retryOptions?: IPubSubPublishRetryOptions;
        },
    ): Promise<string> {
        return this.publisherService.publish(topicName, data, options);
    }

    async publishBatch(
        topicName: string,
        messages: Array<{
            data: Record<string, unknown>;
            attributes?: Record<string, string>;
        }>,
        options?: { retryOptions?: IPubSubPublishRetryOptions },
    ): Promise<string[]> {
        return this.publisherService.publishBatch(topicName, messages, options);
    }

    async subscribe(
        subscriptionName: string,
        handler: (message: IPubSubMessage) => Promise<void>,
        options?: IPubSubSubscribeOptions,
    ): Promise<void> {
        return this.subscriberService.subscribe(
            subscriptionName,
            handler,
            options,
        );
    }

    async unsubscribe(subscriptionName: string): Promise<void> {
        return this.subscriberService.unsubscribe(subscriptionName);
    }

    isSubscribed(subscriptionName: string): boolean {
        return this.subscriberService.isSubscribed(subscriptionName);
    }

    getActiveSubscriptions(): string[] {
        return this.subscriberService.getActiveSubscriptions();
    }
}
