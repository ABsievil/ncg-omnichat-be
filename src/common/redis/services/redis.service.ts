import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
    constructor(private readonly client: Redis) {}

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
        return this.parse(await this.client.get(key));
    }

    async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
        const serialized = this.serialize(value);
        if (ttlSeconds) {
            await this.client.setex(key, ttlSeconds, serialized);
        } else {
            await this.client.set(key, serialized);
        }
    }

    async del(...keys: string[]): Promise<number> {
        return this.client.del(...keys);
    }

    async exists(...keys: string[]): Promise<number> {
        return this.client.exists(...keys);
    }

    async ttl(key: string): Promise<number> {
        return this.client.ttl(key);
    }

    async keys(pattern: string): Promise<string[]> {
        return this.client.keys(pattern);
    }

    async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
        const results = await this.client.mget(...keys);
        return results.map(data => this.parse<T>(data));
    }

    async mset(keyValues: Record<string, any>): Promise<void> {
        const pairs = Object.entries(keyValues).flatMap(([key, value]) => [
            key,
            this.serialize(value),
        ]);
        await this.client.mset(...pairs);
    }

    async getMany<T = any>(keys: string[]): Promise<(T | null)[]> {
        return this.mget<T>(keys);
    }

    async setMany(
        keyValues: Record<string, any>,
        ttlSeconds?: number
    ): Promise<void> {
        if (ttlSeconds) {
            const pipeline = this.client.pipeline();
            Object.entries(keyValues).forEach(([key, value]) =>
                pipeline.setex(key, ttlSeconds, this.serialize(value))
            );
            await pipeline.exec();
        } else {
            await this.mset(keyValues);
        }
    }

    async delMany(keys: string[]): Promise<number> {
        return this.client.del(...keys);
    }

    async existsMany(keys: string[]): Promise<number> {
        return this.client.exists(...keys);
    }

    getClient(): Redis {
        return this.client;
    }

    async onModuleDestroy(): Promise<void> {
        await this.client.quit();
    }
}
