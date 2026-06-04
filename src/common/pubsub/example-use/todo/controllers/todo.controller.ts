import { Body, Controller, Param, Post } from '@nestjs/common';
import { UseDecryption } from 'src/common/encryption/decorators/encryption.decorator';
import { PubSubService } from 'src/common/pubsub/services/pubsub.service';
@Controller('todos')
export class TodoController {
    constructor(private readonly pubSubService: PubSubService) {}

    /**
     * Gửi một tin nhắn đến một chủ đề
     */
    @UseDecryption(true)
    @Post('publish/:topic')
    async publishMessage(
        @Param('topic') topic: string,
        @Body() data: Record<string, any>
    ) {
        const messageId = await this.pubSubService.publish(topic, data);
        return { messageId };
    }
}
