// Server-only advanced cache implementation compatible with the client API.

export type Priority = 'low' | 'medium' | 'high' | 'critical';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
  size: number;
}

export interface CacheOptions {
  ttl?: number;
  priority?: Priority; // not used in server variant but accepted for API parity
  tags?: string[];
}

class AdvancedCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxEntries: number;

  constructor(maxEntries = 5000) {
    this.maxEntries = maxEntries;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, options: CacheOptions = {}): boolean {
    if (this.cache.size >= this.maxEntries) {
      // simple FIFO eviction for server
      const firstKey = this.cache.keys().next().value as string | undefined;
      if (firstKey) this.cache.delete(firstKey);
    }
    const ttl = options.ttl ?? 5 * 60 * 1000; // 5m default
    const tags = options.tags ?? [];
    const size = this.calculateSize(data);
    this.cache.set(key, { data, timestamp: Date.now(), ttl, tags, size });
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  deleteByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.cache.clear();
  }

  private calculateSize(data: any): number {
    try {
      return Buffer.byteLength(JSON.stringify(data));
    } catch {
      return 1024;
    }
  }
}

let globalCache: AdvancedCache | null = null;
export function getGlobalCache(): AdvancedCache {
  if (!globalCache) globalCache = new AdvancedCache();
  return globalCache;
}

// Server-side cached decorator
export function cached<T extends (...args: any[]) => any>(
  fn: T,
  options: CacheOptions & { keyGenerator?: (...args: Parameters<T>) => string } = {}
): T {
  const cache = getGlobalCache();
  const { keyGenerator = (...args) => JSON.stringify(args), ...cacheOptions } = options;

  return (function(this: any, ...args: Parameters<T>) {
    const key = `fn_${fn.name}_${keyGenerator(...args)}`;
    const hit = cache.get<any>(key);
    if (hit !== null) return hit;
    const result = fn.apply(this, args);
    if (result instanceof Promise) {
      return result.then((resolved: any) => {
        cache.set(key, resolved, cacheOptions);
        return resolved;
      });
    }
    cache.set(key, result, cacheOptions);
    return result;
  }) as T;
}

export default AdvancedCache;
