import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { pubSubClientProvider } from 'src/common/pubsub/providers/pubsub-client.provider';
import { PubSubPublisherService } from 'src/common/pubsub/services/pubsub.publisher.service';
import { PubSubService } from 'src/common/pubsub/services/pubsub.service';
import { PubSubSubscriberService } from 'src/common/pubsub/services/pubsub.subscriber.service';

@Global()
@Module({})
export class PubSubModule {
    static forRoot(): DynamicModule {
        return {
            module: PubSubModule,
            imports: [ConfigModule],
            providers: [
                pubSubClientProvider,
                PubSubPublisherService,
                PubSubSubscriberService,
                PubSubService,
            ],
            exports: [
                PubSubService,
                PubSubPublisherService,
                PubSubSubscriberService,
            ],
        };
    }
}
