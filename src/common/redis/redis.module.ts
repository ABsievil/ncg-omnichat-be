import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from 'src/common/redis/services/redis.service';

@Module({})
export class RedisModule {
    static forRoot(): DynamicModule {
        return {
            module: RedisModule,
            imports: [ConfigModule],
            providers: [
                {
                    provide: Redis,
                    inject: [ConfigService],
                    useFactory: (configService: ConfigService) => {
                        const host =
                            configService.get<string>('redis.cached.host');
                        const port =
                            configService.get<number>('redis.cached.port');
                        const password = configService.get<string>(
                            'redis.cached.password'
                        );
                        const username = configService.get<string>(
                            'redis.cached.username'
                        );
                        const tls =
                            configService.get<boolean>('redis.cached.tls');

                        const client = new Redis({
                            host,
                            port,
                            password,
                            username,
                            tls: tls
                                ? { rejectUnauthorized: false }
                                : undefined,
                            retryStrategy: times => {
                                const delay = Math.min(times * 50, 2000);
                                return delay;
                            },
                            maxRetriesPerRequest: 3,
                        });

                        return client;
                    },
                },
                RedisService,
            ],
            exports: [Redis, RedisService],
            global: true,
        };
    }
}
