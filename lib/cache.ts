type CacheItem<T> = {
  data: T;
  expiresAt: number;
};

// Simple in-memory cache
const cache: Record<string, CacheItem<any>> = {};

// Cache duration: 5 minutes
const CACHE_TTL_MS = 5 * 60 * 1000;

export function getCache<T>(key: string): T | null {
  const item = cache[key];
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    delete cache[key];
    return null;
  }
  return item.data;
}

export function setCache<T>(key: string, data: T): void {
  cache[key] = {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
}
