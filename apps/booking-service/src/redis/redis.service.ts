import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  }

  getClient(): Redis {
    return this.client;
  }

  async setNxEx(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  /**
   * Reads several keys plus their remaining TTL in one round trip so building a
   * seat map stays O(1) network calls instead of two per seat.
   */
  async getManyWithTtl(
    keys: string[],
  ): Promise<Map<string, { value: string; ttlMs: number }>> {
    const result = new Map<string, { value: string; ttlMs: number }>();
    if (keys.length === 0) {
      return result;
    }

    const pipeline = this.client.pipeline();
    for (const key of keys) {
      pipeline.get(key);
      pipeline.pttl(key);
    }
    const replies = (await pipeline.exec()) ?? [];

    keys.forEach((key, index) => {
      const value = replies[index * 2]?.[1];
      const ttl = replies[index * 2 + 1]?.[1];
      if (typeof value === 'string') {
        result.set(key, {
          value,
          ttlMs: typeof ttl === 'number' && ttl > 0 ? ttl : 0,
        });
      }
    });

    return result;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
