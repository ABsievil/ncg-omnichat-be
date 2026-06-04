import { PubSub } from '@google-cloud/pubsub';
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PUBSUB_CLIENT_NAME } from 'src/common/pubsub/constants/pubsub.constant';
import { PublisherController } from 'src/common/pubsub/controllers/publisher.controller';
import { PubSubPublisherService } from 'src/common/pubsub/services/pubsub.publisher.service';
import { PubSubService } from 'src/common/pubsub/services/pubsub.service';
import { PubSubSubscriberService } from 'src/common/pubsub/services/pubsub.subscriber.service';
import { ContractBillSubscriber } from 'src/common/pubsub/subscribers/contract-bill.subscriber';
import { PaymentTransactionBillSubscriber } from 'src/common/pubsub/subscribers/payment-transaction-bill.subscriber';
import { BillModule } from 'src/modules/bill/bill.module';
import { ContractModule } from 'src/modules/contract/contract.module';
import { CustomerModule } from 'src/modules/customer/customer.module';
import { PaymentTransactionModule } from 'src/modules/payment-transaction/payment-transaction.module';

@Global()
@Module({})
export class PubSubModule {
    static forRoot(): DynamicModule {
        const providers: Provider[] = [
            {
                provide: PUBSUB_CLIENT_NAME,
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => {
                    const projectId =
                        configService.get<string>('pubsub.projectId');

                    const clientEmail = configService.get<string>(
                        'firebase.clientEmail'
                    );
                    const privateKey = configService.get<string>(
                        'firebase.privateKey'
                    );

                    try {
                        return new PubSub({
                            projectId,
                            credentials: {
                                client_email: clientEmail,
                                private_key: privateKey.replace(/\\n/g, '\n'),
                            },
                        });
                    } catch (error) {
                        console.error(
                            'Error creating PubSub client:',
                            error.message
                        );
                    }
                },
            },
            PubSubService,
            PubSubPublisherService,
            PubSubSubscriberService,
            ContractBillSubscriber,
            PaymentTransactionBillSubscriber,
        ];

        return {
            module: PubSubModule,
            providers,
            exports: [
                PubSubService,
                PubSubPublisherService,
                PubSubSubscriberService,
            ],
            imports: [
                ConfigModule,
                BillModule,
                ContractModule,
                CustomerModule,
                PaymentTransactionModule,
            ],
            controllers: [PublisherController],
        };
    }
}
