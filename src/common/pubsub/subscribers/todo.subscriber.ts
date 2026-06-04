import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TODO_SUBSCRIPTION_NAME } from 'src/common/pubsub/constants/session-pubsub.constant';
import { IPubSubMessage } from 'src/common/pubsub/interfaces/pubsub.interface';
import { PubSubService } from 'src/common/pubsub/services/pubsub.service';

@Injectable()
export class TodoSubscriber implements OnModuleInit {
    private readonly logger = new Logger(TodoSubscriber.name);
    private readonly SUBSCRIPTION_NAME = TODO_SUBSCRIPTION_NAME;

    constructor(private readonly pubSubService: PubSubService) {}

    async onModuleInit() {
        try {
            await this.pubSubService.subscribe(
                this.SUBSCRIPTION_NAME,
                this.handleTodoEventMessage.bind(this)
            );
        } catch (error) {
            this.logger.error(
                `Failed to subscribe to ${this.SUBSCRIPTION_NAME}: ${error.message}`,
                error.stack
            );
        }
    }

    /**
     * @description Xử lý todo khi có sự kiện từ PubSub
     */
    private async handleTodoEventMessage(
        message: IPubSubMessage
    ): Promise<void> {
        try {
            const messageData = JSON.parse(message.data.toString());

            // Xử lý dữ liệu ở đây
        } catch (error) {
            this.logger.error(
                `Error processing inventory log event message: ${error.message}`,
                error.stack
            );
            throw error;
        }
    }
}
