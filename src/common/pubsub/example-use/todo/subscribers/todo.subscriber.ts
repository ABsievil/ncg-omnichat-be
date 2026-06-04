import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPubSubMessage } from 'src/common/pubsub/interfaces/pubsub.interface';
import { PubSubService } from 'src/common/pubsub/services/pubsub.service';

@Injectable()
export class TodoSubscriber implements OnModuleInit {
    private readonly logger = new Logger(TodoSubscriber.name);
    private readonly TOPIC_NAME = 'todos';
    private readonly SUBSCRIPTION_NAME = 'todos-subscription';

    constructor(
        private readonly pubSubService: PubSubService,
        private readonly configService: ConfigService
    ) {}

    /**
     * Đăng ký vào subscription khi module khởi động
     */
    async onModuleInit() {
        try {
            // this.logger.log(`Subscribing to ${this.SUBSCRIPTION_NAME}`);
            await this.pubSubService.subscribe(
                this.SUBSCRIPTION_NAME,
                this.handleTodoMessage.bind(this)
            );
            // this.logger.log(
            //     `Successfully subscribed to ${this.SUBSCRIPTION_NAME}`
            // );
        } catch (error) {
            this.logger.error(
                `Failed to subscribe to ${this.SUBSCRIPTION_NAME}: ${error.message}`,
                error.stack
            );
        }
    }

    /**
     * Xử lý các tin nhắn từ PubSub
     */
    private async handleTodoMessage(message: IPubSubMessage): Promise<void> {
        try {
            this.logger.debug(`Processing todo message: ${message.id}`);

            // Phân tích dữ liệu tin nhắn
            // const data = JSON.parse(message.data.toString()) as any;

            this.logger.debug(
                `Successfully processed todo message: ${message.id}`
            );
        } catch (error) {
            this.logger.error(
                `Error processing todo message: ${error.message}`,
                error.stack
            );
            throw error;
        }
    }
}
