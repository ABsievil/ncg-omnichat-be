import { DynamicModule, Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from 'src/common/redis/services/redis.service';

@Global()
@Module({})
export class RedisModule {
    private static readonly logger = new Logger(RedisModule.name);

    static forRoot(): DynamicModule {
        return {
            module: RedisModule,
            imports: [ConfigModule],
            providers: [
                {
                    provide: Redis,
                    inject: [ConfigService],
                    useFactory: (configService: ConfigService) => {
                        const url: string =
                            configService.get<string>('redis.cached.url') ??
                            'redis://127.0.0.1:6379';

                        const client = new Redis(url, {
                            retryStrategy: (times: number) =>
                                Math.min(times * 50, 2000),
                            maxRetriesPerRequest: 3,
                            ...(url.startsWith('rediss://')
                                ? {
                                      tls: {
                                          rejectUnauthorized: false,
                                      },
                                  }
                                : {}),
                        });

                        client.on('error', (error: Error) => {
                            RedisModule.logger.warn(
                                `Redis connection error: ${error.message}`,
                            );
                        });

                        client.on('connect', () => {
                            RedisModule.logger.log('Redis connected');
                        });

                        return client;
                    },
                },
                RedisService,
            ],
            exports: [Redis, RedisService],
        };
    }
}
