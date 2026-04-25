/**
 * Request Cache - Centralized caching system with TTL and invalidation
 *
 * Provides intelligent caching for API responses with:
 * - Time-to-live (TTL) support
 * - Pattern-based cache invalidation
 * - Request deduplication (concurrent requests share the same promise)
 * - Stale-while-revalidate support
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  entityTimestamp?: number; // Last known updated_at from server
  etag?: string; // ETag header from server
  lastModified?: Date; // Last-Modified header from server
  promise?: Promise<T>; // For request deduplication
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  swr?: boolean; // Stale-while-revalidate: return stale data immediately, fetch fresh in background
}

/**
 * Response metadata from API calls
 */
interface ResponseMetadata {
  status: number;
  headers: Headers;
}

/**
 * Fetcher function that accepts conditional headers and returns Result with metadata
 * For backward compatibility, also supports simple fetchers that return T or Result<T, AppError>
 */
type ConditionalFetcher<T> = (conditionalHeaders?: {
  ifNoneMatch?: string;
  ifModifiedSince?: string;
}) => Promise<
  | { data: T; metadata: ResponseMetadata }
  | { data: null; metadata: ResponseMetadata; isNotModified: true }
>;

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL: number;

  constructor(defaultTTL: number = 30000) {
    // Default TTL: 30 seconds
    this.defaultTTL = defaultTTL;
  }

  /**
   * Extract ETag and Last-Modified from response headers
   */
  private extractCacheHeaders(headers: Headers): {
    etag?: string;
    lastModified?: Date;
  } {
    const etag = headers.get("ETag");
    const lastModifiedStr = headers.get("Last-Modified");

    return {
      etag: etag || undefined,
      lastModified: lastModifiedStr ? new Date(lastModifiedStr) : undefined,
    };
  }

  /**
   * Get data from cache or fetch if not cached/expired
   * Supports both simple fetchers (backward compatible) and conditional fetchers (with ETag/Last-Modified)
   *
   * @param key - Cache key (e.g., 'processes:all', 'case:123')
   * @param fetcher - Function that returns a Promise with the data, or conditional fetcher that accepts headers
   * @param options - Cache options (TTL, stale-while-revalidate)
   * @returns Cached data or freshly fetched data
   *
   * @example
   * ```typescript
   * // Simple fetcher (backward compatible)
   * const processes = await requestCache.get('processes:all', async () => {
   *   const result = await processService.getAllProcesses();
   *   return result.success ? result.value : [];
   * });
   *
   * // Conditional fetcher (with ETag support)
   * const processes = await requestCache.get('processes:all', async (conditionalHeaders) => {
   *   const result = await processService.getAllProcesses(conditionalHeaders);
   *   if (result.success) {
   *     return { data: result.value.data, metadata: { status: result.value.status, headers: result.value.headers } };
   *   }
   *   throw new Error('Failed to fetch');
   * });
   * ```
   */
  async get<T>(
    key: string,
    // Use Promise<any> for simple fetchers to avoid type mismatches when
    // fetchers return Result<Ok, Err> unions with slightly different generic params
    fetcher: (() => Promise<any>) | ConditionalFetcher<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    const { ttl = this.defaultTTL, swr = false } = options;
    const entry = this.cache.get(key);
    const now = Date.now();

    // Check if cache entry exists and is still valid
    if (entry) {
      const age = now - entry.timestamp;
      const isValid = age < ttl;

      if (isValid && entry.data !== undefined) {
        // Cache is valid, return cached data
        if (swr) {
          // Stale-while-revalidate: return stale data immediately, fetch fresh in background
          this.refreshInBackground(key, fetcher as any, ttl);
        }
        return entry.data;
      }

      // Cache expired or data is undefined
      if (swr && entry.data !== undefined) {
        // Return stale data immediately, refresh in background
        this.refreshInBackground(key, fetcher as any, ttl);
        return entry.data;
      }

      // If there's an in-flight request, return its promise
      if (entry.promise) {
        return entry.promise;
      }
    }

    // Build conditional headers if cache entry has ETag/Last-Modified
    const conditionalHeaders = this.buildConditionalHeaders(entry);

    // Check if fetcher supports conditional requests (has conditionalHeaders parameter)
    const isConditionalFetcher = fetcher.length > 0;

    // Fetch fresh data
    let promise: Promise<T>;

    if (isConditionalFetcher) {
      // Use conditional fetcher (pass undefined if no headers available)
      const conditionalFetcher = fetcher as ConditionalFetcher<T>;
      promise = conditionalFetcher(conditionalHeaders || undefined)
        .then((result) => {
          if ("isNotModified" in result && result.isNotModified) {
            // 304 Not Modified - return cached data
            if (entry && entry.data !== undefined) {
              return entry.data;
            }
            throw new Error("304 Not Modified but no cached data available");
          }

          // Extract and store cache headers
          const { etag, lastModified } = this.extractCacheHeaders(
            result.metadata.headers,
          );

          // Update cache entry with new data and headers
          // result.data might be a Result<T, AppError> or just T
          const updatedEntry = this.cache.get(key);
          if (updatedEntry) {
            updatedEntry.data = result.data;
            updatedEntry.timestamp = now;
            if (etag) updatedEntry.etag = etag;
            if (lastModified) updatedEntry.lastModified = lastModified;
          } else {
            this.cache.set(key, {
              data: result.data,
              timestamp: now,
              etag,
              lastModified,
            });
          }

          return result.data;
        })
        .catch((error) => {
          // If the conditional fetcher throws an error, ensure it's properly handled
          // Remove from cache so it can be retried
          this.cache.delete(key);
          throw error;
        });
    } else {
      // Simple fetcher (backward compatible)
      const simpleFetcher = fetcher as () => Promise<T>;
      promise = simpleFetcher();
    }

    // Store promise for request deduplication
    this.cache.set(key, {
      data: undefined as T,
      timestamp: now,
      promise,
    });

    try {
      const data = await promise;

      // If we didn't update the cache in the conditional fetcher path, update it now
      const currentEntry = this.cache.get(key);
      if (currentEntry && currentEntry.data === undefined) {
        currentEntry.data = data;
      } else if (!currentEntry) {
        this.cache.set(key, {
          data,
          timestamp: now,
        });
      }

      return data;
    } catch (error) {
      // Remove failed request from cache
      this.cache.delete(key);
      // If error is already a Result with error, return it
      if (
        error &&
        typeof error === "object" &&
        "success" in error &&
        !error.success
      ) {
        return error as T;
      }
      // Otherwise, wrap the error in a Result-like structure if T is Result
      throw error;
    }
  }

  /**
   * Refresh data in background (for stale-while-revalidate)
   */
  private async refreshInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number,
  ): Promise<void> {
    try {
      const data = await fetcher();
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
      });
    } catch (error) {
      // Silently fail background refresh - don't remove cache on error
      if (import.meta.env.DEV) {
        console.warn(
          `[RequestCache] Background refresh failed for ${key}:`,
          error,
        );
      }
    }
  }

  /**
   * Invalidate cache entries matching a pattern
   *
   * @param pattern - String pattern to match (checks if key includes pattern) or RegExp
   *
   * @example
   * ```typescript
   * // Invalidate all process-related caches
   * requestCache.invalidate('processes');
   *
   * // Invalidate specific case
   * requestCache.invalidate('case:123');
   *
   * // Invalidate using regex
   * requestCache.invalidate(/^workitems:/);
   * ```
   */
  invalidate(pattern: string | RegExp): void {
    for (const key of this.cache.keys()) {
      const matches =
        typeof pattern === "string" ? key.includes(pattern) : pattern.test(key);

      if (matches) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate cache entries for a specific entity and related caches
   *
   * @param entityType - Entity type (e.g., 'case', 'process', 'workitem')
   * @param entityId - Optional entity ID (e.g., 123)
   *
   * @example
   * ```typescript
   * // Invalidate all case caches
   * requestCache.invalidateEntity('case');
   *
   * // Invalidate specific case and related caches
   * requestCache.invalidateEntity('case', 123);
   * ```
   */
  invalidateEntity(entityType: string, entityId?: number): void {
    // Invalidate specific entity
    if (entityId !== undefined) {
      this.invalidate(`${entityType}:${entityId}`);
    }

    // Invalidate list views
    this.invalidate(`${entityType}:all`);
    this.invalidate(`${entityType}:list`);

    // Invalidate related entities based on entity type
    if (entityType === "case") {
      this.invalidate("cases"); // Explicitly invalidate cases (plural) cache keys
      this.invalidate("processes"); // Cases are shown in process views
      this.invalidate("workitems"); // Cases have tasks that are work items
    } else if (entityType === "process") {
      this.invalidate("cases"); // Processes are shown in case views
    } else if (entityType === "workitem" || entityType === "workitems") {
      // Work items might be shown in various views
      this.invalidate("cases"); // Work items can be case tasks
    }
  }

  /**
   * Build conditional headers from cache entry for HTTP conditional requests
   *
   * @param entry - Cache entry with ETag/Last-Modified metadata
   * @returns Object with If-None-Match and/or If-Modified-Since headers, or null if no metadata
   *
   * @example
   * ```typescript
   * const entry = this.cache.get('processes:all');
   * const headers = this.buildConditionalHeaders(entry);
   * // Returns { ifNoneMatch: 'W/"abc123"', ifModifiedSince: 'Wed, 21 Oct 2015 07:28:00 GMT' }
   * ```
   */
  private buildConditionalHeaders<T>(entry: CacheEntry<T> | undefined): {
    ifNoneMatch?: string;
    ifModifiedSince?: string;
  } | null {
    if (!entry) {
      return null;
    }

    const headers: {
      ifNoneMatch?: string;
      ifModifiedSince?: string;
    } = {};

    if (entry.etag) {
      headers.ifNoneMatch = entry.etag;
    }

    if (entry.lastModified) {
      headers.ifModifiedSince = entry.lastModified.toUTCString();
    }

    // Return null if no conditional headers available
    return Object.keys(headers).length > 0 ? headers : null;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics (for debugging)
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const requestCache = new RequestCache();
