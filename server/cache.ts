import NodeCache from 'node-cache';
import { CACHE_CONFIG } from './config';

class CacheService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: CACHE_CONFIG.ttl,
      checkperiod: CACHE_CONFIG.checkPeriod,
    });
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.cache.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    return this.cache.set(key, value, ttl || CACHE_CONFIG.ttl);
  }

  async del(key: string): Promise<number> {
    return this.cache.del(key);
  }

  async flush(): Promise<void> {
    this.cache.flushAll();
  }

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }

  // Invalidate cache for a specific pattern
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = this.cache.keys();
    const regex = new RegExp(pattern);
    const matchingKeys = keys.filter(key => regex.test(key));
    matchingKeys.forEach(key => this.cache.del(key));
  }
}

export const cache = new CacheService(); 