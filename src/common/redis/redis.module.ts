import { DynamicModule, Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
    REDIS_CONFIG_PATH,
    REDIS_DEFAULTS,
} from 'src/common/redis/constants/redis.constant';
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
                        const url =
                            configService.get<string>(
                                REDIS_CONFIG_PATH.CACHED.URL,
                            ) ?? REDIS_DEFAULTS.URL;
                        const port =
                            configService.get<number>(
                                REDIS_CONFIG_PATH.CACHED.PORT,
                            ) ?? REDIS_DEFAULTS.PORT;
                        const password = configService.get<string>(
                            REDIS_CONFIG_PATH.CACHED.PASSWORD,
                        );
                        const db =
                            configService.get<number>(
                                REDIS_CONFIG_PATH.CACHED.DB,
                            ) ?? REDIS_DEFAULTS.DB;

                        const client = new Redis(url, {
                            port,
                            ...(password ? { password } : {}),
                            db,
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
