import { PubSub, Subscription } from '@google-cloud/pubsub';
import {
    Inject,
    Injectable,
    Logger,
    OnApplicationShutdown,
} from '@nestjs/common';
import { PUBSUB_CLIENT_NAME } from 'src/common/pubsub/constants/pubsub.constant';
import { IPubSubMessage } from 'src/common/pubsub/interfaces/pubsub.interface';

@Injectable()
export class PubSubSubscriberService implements OnApplicationShutdown {
    private readonly logger = new Logger(PubSubSubscriberService.name);
    private readonly activeSubscriptions: Map<string, Subscription> = new Map();

    constructor(
        @Inject(PUBSUB_CLIENT_NAME) private readonly pubSubClient: PubSub
    ) {}

    /**
     * Đăng ký vào một subscription và xử lý các tin nhắn đến
     */
    async subscribe(
        subscriptionName: string,
        handler: (message: IPubSubMessage) => Promise<void>,
        options: {
            flowControl?: {
                maxMessages?: number;
                allowExcessMessages?: boolean;
            };
        } = {}
    ): Promise<void> {
        // Bỏ qua nếu đã đăng ký
        if (this.activeSubscriptions.has(subscriptionName)) {
            return;
        }

        // this.logger.log(`Subscribing to '${subscriptionName}'`);

        try {
            // Lấy subscription với các tùy chọn kiểm soát luồng
            const subscription = this.pubSubClient.subscription(
                subscriptionName,
                {
                    flowControl: {
                        maxMessages: options?.flowControl?.maxMessages || 10,
                        allowExcessMessages:
                            options?.flowControl?.allowExcessMessages || false,
                    },
                }
            );

            // Thiết lập trình xử lý tin nhắn
            subscription.on('message', async message => {
                // this.logger.debug(
                //     `Received message from '${subscriptionName}': ${message.id}`
                // );

                try {
                    // Phân tích nội dung tin nhắn
                    const parsedMessage: IPubSubMessage = {
                        id: message.id,
                        data: message.data,
                        attributes: message.attributes,
                        publishTime: message.publishTime,
                    };

                    // Xử lý tin nhắn
                    await handler(parsedMessage);

                    // Xác nhận tin nhắn
                    message.ack();
                } catch (error) {
                    this.logger.error(
                        `Failed to process message from '${subscriptionName}': ${error.message}`,
                        error.stack
                    );

                    // Không xác nhận tin nhắn để thử lại sau
                    message.nack();
                }
            });

            subscription.on('error', error => {
                this.logger.error(
                    `Error in subscription '${subscriptionName}': ${error.message}`,
                    error.stack
                );
            });

            // Đánh dấu là đang hoạt động
            this.activeSubscriptions.set(subscriptionName, subscription);
        } catch (error) {
            this.logger.error(
                `Failed to subscribe to '${subscriptionName}': ${error.message}`,
                error.stack
            );
            throw error;
        }
    }

    /**
     * Hủy đăng ký khỏi một subscription
     */
    async unsubscribe(subscriptionName: string): Promise<void> {
        const subscription = this.activeSubscriptions.get(subscriptionName);

        if (!subscription) {
            return;
        }

        try {
            await subscription.close();
            this.activeSubscriptions.delete(subscriptionName);
        } catch (error) {
            this.logger.error(
                `Failed to unsubscribe from '${subscriptionName}': ${error.message}`,
                error.stack
            );
            throw error;
        }
    }

    /**
     * Kiểm tra xem một subscription có đang hoạt động không
     */
    isSubscribed(subscriptionName: string): boolean {
        return this.activeSubscriptions.has(subscriptionName);
    }

    /**
     * Lấy tất cả tên của các subscription đang hoạt động
     */
    getActiveSubscriptions(): string[] {
        return Array.from(this.activeSubscriptions.keys());
    }

    /**
     * Dọn dẹp các subscription khi ứng dụng tắt
     */
    async onApplicationShutdown(): Promise<void> {
        this.logger.log('Shutting down PubSub subscriptions...');

        const subscriptions = Array.from(this.activeSubscriptions.entries());

        for (const [name, subscription] of subscriptions) {
            try {
                await subscription.close();
                // this.logger.log(`Closed subscription: ${name}`);
            } catch (error) {
                this.logger.error(
                    `Error closing subscription ${name}: ${error.message}`
                );
            }
        }

        this.activeSubscriptions.clear();
    }
}
