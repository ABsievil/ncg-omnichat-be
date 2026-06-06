import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
    REDIS_CONFIG_PATH,
    REDIS_DEFAULTS,
} from 'src/common/redis/constants/redis.constant';

@Injectable()
export class RedisService implements OnModuleDestroy {
    constructor(
        private readonly client: Redis,
        private readonly configService: ConfigService,
    ) {}

    private get keyPrefix(): string {
        return (
            this.configService.get<string>(
                REDIS_CONFIG_PATH.CACHED.KEY_PREFIX,
            ) ?? REDIS_DEFAULTS.KEY_PREFIX
        );
    }

    private buildKey(key: string): string {
        if (key.startsWith(this.keyPrefix)) {
            return key;
        }

        return `${this.keyPrefix}${key}`;
    }

    private buildKeys(keys: string[]): string[] {
        return keys.map(key => this.buildKey(key));
    }

    private buildPattern(pattern: string): string {
        if (pattern.startsWith(this.keyPrefix)) {
            return pattern;
        }

        return `${this.keyPrefix}${pattern}`;
    }

    private parse<T>(data: string | null): T | null {
        if (!data) return null;
        try {
            return JSON.parse(data) as T;
        } catch {
            return data as any;
        }
    }

    private serialize(value: any): string {
        return typeof value === 'string' ? value : JSON.stringify(value);
    }

    async get<T = any>(key: string): Promise<T | null> {
        return this.parse(await this.client.get(this.buildKey(key)));
    }

    async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
        const redisKey = this.buildKey(key);
        const serialized = this.serialize(value);
        if (ttlSeconds) {
            await this.client.setex(redisKey, ttlSeconds, serialized);
        } else {
            await this.client.set(redisKey, serialized);
        }
    }

    async del(...keys: string[]): Promise<number> {
        return this.client.del(...this.buildKeys(keys));
    }

    async exists(...keys: string[]): Promise<number> {
        return this.client.exists(...this.buildKeys(keys));
    }

    async ttl(key: string): Promise<number> {
        return this.client.ttl(this.buildKey(key));
    }

    async keys(pattern: string): Promise<string[]> {
        const prefixedKeys = await this.client.keys(
            this.buildPattern(pattern),
        );

        return prefixedKeys.map(key =>
            key.startsWith(this.keyPrefix)
                ? key.slice(this.keyPrefix.length)
                : key,
        );
    }

    async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
        const results = await this.client.mget(...this.buildKeys(keys));
        return results.map(data => this.parse<T>(data));
    }

    async mset(keyValues: Record<string, any>): Promise<void> {
        const pairs = Object.entries(keyValues).flatMap(([key, value]) => [
            this.buildKey(key),
            this.serialize(value),
        ]);
        await this.client.mset(...pairs);
    }

    async getMany<T = any>(keys: string[]): Promise<(T | null)[]> {
        return this.mget<T>(keys);
    }

    async setMany(
        keyValues: Record<string, any>,
        ttlSeconds?: number,
    ): Promise<void> {
        if (ttlSeconds) {
            const pipeline = this.client.pipeline();
            Object.entries(keyValues).forEach(([key, value]) =>
                pipeline.setex(
                    this.buildKey(key),
                    ttlSeconds,
                    this.serialize(value),
                ),
            );
            await pipeline.exec();
        } else {
            await this.mset(keyValues);
        }
    }

    async delMany(keys: string[]): Promise<number> {
        return this.client.del(...this.buildKeys(keys));
    }

    async existsMany(keys: string[]): Promise<number> {
        return this.client.exists(...this.buildKeys(keys));
    }

    getClient(): Redis {
        return this.client;
    }

    async onModuleDestroy(): Promise<void> {
        await this.client.quit();
    }
}
