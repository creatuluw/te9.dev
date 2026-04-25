/**
 * Message cache - LRU in-memory cache for unread counts and recent messages.
 * FR-7: Message Caching Layer
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // timestamp in ms
  createdAt: number;
}

export class LRUCache<T = unknown> {
  private entries: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const entry = this.entries.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      this.misses++;
      return null;
    }
    // Move to end (most recently used)
    this.entries.delete(key);
    this.entries.set(key, entry);
    this.hits++;
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    // Remove if exists (to move to end)
    this.entries.delete(key);
    // Evict oldest if at capacity
    while (this.entries.size >= this.maxSize) {
      const firstKey = this.entries.keys().next().value;
      if (firstKey !== undefined) this.entries.delete(firstKey);
    }
    this.entries.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
    });
  }

  invalidate(prefix: string): number {
    let count = 0;
    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) {
        this.entries.delete(key);
        count++;
      }
    }
    return count;
  }

  delete(key: string): boolean {
    return this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
    this.hits = 0;
    this.misses = 0;
  }

  get size(): number {
    return this.entries.size;
  }

  getHitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : this.hits / total;
  }

  getStats(): { size: number; hits: number; misses: number; hitRate: number } {
    return {
      size: this.entries.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate(),
    };
  }
}

// TTL constants for cache entries
const UNREAD_TTL = 60_000; // 60 seconds
const MESSAGES_TTL = 30_000; // 30 seconds

/**
 * Domain-specific message cache singleton.
 * Provides methods for caching unread counts and recent messages.
 */
export const messageCache = {
  _cache: new LRUCache(1000),

  getUnreadCount(userId: string): number | null {
    const value = this._cache.get(`unread:${userId}`);
    return typeof value === "number" ? value : null;
  },

  setUnreadCount(userId: string, count: number): void {
    this._cache.set(`unread:${userId}`, count, UNREAD_TTL);
  },

  getRecentMessages(source: string, userId: string): unknown | null {
    const value = this._cache.get(`messages:${source}:${userId}`);
    return value;
  },

  setRecentMessages(source: string, userId: string, messages: unknown): void {
    this._cache.set(`messages:${source}:${userId}`, messages, MESSAGES_TTL);
  },

  /**
   * Invalidates all cached data for a specific user.
   * Used when user state changes significantly.
   */
  invalidateForUser(userId: string): void {
    this._cache.delete(`unread:${userId}`);
    // Invalidate all message caches for consistency
    // A user's action could affect shared entity messages
    this._cache.invalidate(`messages:`);
  },

  /**
   * Invalidates caches when a new message is created.
   * Clears unread count and source-specific message cache.
   */
  invalidateOnMessageCreation(userId: string, source?: string): void {
    this._cache.delete(`unread:${userId}`);
    if (source) {
      this._cache.invalidate(`messages:${source}:`);
    }
  },

  /**
   * Invalidates unread count when messages are marked as read.
   */
  invalidateOnRead(userId: string): void {
    this._cache.delete(`unread:${userId}`);
  },

  /**
   * Clears all cached data. Called on logout.
   */
  clearAll(): void {
    this._cache.clear();
  },

  /**
   * Returns cache statistics for monitoring.
   */
  getStats() {
    return this._cache.getStats();
  },
};
