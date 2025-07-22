// src/lib/cache.ts
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize = 100; // Maximum number of cached items

  set<T>(key: string, data: T, ttlMs = 300000): void { // 5 minutes default TTL
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries());
      if (entries.length > 0) {
        this.cache.delete(entries[0][0]);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Get cache stats for debugging
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Global cache instance
export const memoryCache = new MemoryCache();

// Cache keys
export const CACHE_KEYS = {
  EXPENSES: (userId: string) => `expenses:${userId}`,
  SUBSCRIPTIONS: (userId: string) => `subscriptions:${userId}`,
  BUDGETS: (userId: string) => `budgets:${userId}`,
  GOALS: (userId: string) => `goals:${userId}`,
  ACCOUNTS: (userId: string) => `accounts:${userId}`,
  AI_TIPS: (contextHash: string) => `ai_tips:${contextHash}`,
  FIRESTORE_DATA: (collection: string, userId: string) => `firestore:${collection}:${userId}`,
} as const;

// Utility functions for common caching patterns
export const withCache = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs = 300000
): Promise<T> => {
  const cached = memoryCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const data = await fetchFn();
  memoryCache.set(key, data, ttlMs);
  return data;
};

// Hash function for cache keys (simple but effective)
export const hashObject = (obj: any): string => {
  return btoa(JSON.stringify(obj)).slice(0, 16);
};

// Clear cache for specific user
export const clearUserCache = (userId: string): void => {
  const userCacheKeys = [
    CACHE_KEYS.EXPENSES(userId),
    CACHE_KEYS.SUBSCRIPTIONS(userId),
    CACHE_KEYS.BUDGETS(userId),
    CACHE_KEYS.GOALS(userId),
    CACHE_KEYS.ACCOUNTS(userId),
  ];

  userCacheKeys.forEach(key => memoryCache.delete(key));
};
