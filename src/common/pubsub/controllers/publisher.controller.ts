import { Controller } from '@nestjs/common';
import { PubSubService } from 'src/common/pubsub/services/pubsub.service';

@Controller('pubsub')
export class PublisherController {
    constructor(private readonly pubSubService: PubSubService) {}
}
