import { Injectable } from '@nestjs/common';
import {
    IPubSubMessage,
    IPubSubPublishOptions,
} from 'src/common/pubsub/interfaces/pubsub.interface';
import { PubSubPublisherService } from 'src/common/pubsub/services/pubsub.publisher.service';
import { PubSubSubscriberService } from 'src/common/pubsub/services/pubsub.subscriber.service';

@Injectable()
export class PubSubService {
    constructor(
        private readonly pubSubPublisherService: PubSubPublisherService,
        private readonly pubSubSubscriberService: PubSubSubscriberService
    ) {}

    /**
     * Gửi một tin nhắn đến một chủ đề
     */
    async publish(
        topicName: string,
        data: Record<string, any>,
        options?: IPubSubPublishOptions
    ): Promise<string> {
        return this.pubSubPublisherService.publish(topicName, data, options);
    }

    /**
     * Đăng ký vào một subscription
     */
    async subscribe(
        subscriptionName: string,
        handler: (message: IPubSubMessage) => Promise<void>
    ): Promise<void> {
        return this.pubSubSubscriberService.subscribe(
            subscriptionName,
            handler
        );
    }
}
