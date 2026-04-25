/**
 * Server Cache - Generic in-memory TTL cache for server-side use
 *
 * Simple cache with lazy expiration (checked on read, no timers/intervals).
 * Designed for single-threaded Node.js — no mutex needed.
 */

import type { Permission } from "$lib/schemas/auth";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class ServerCache<T> {
  private entries = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;

  constructor(defaultTTL: number = 60000) {
    this.defaultTTL = defaultTTL;
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() > entry.expiresAt;
  }

  get(key: string): T | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.entries.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    this.entries.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTTL),
    });
  }

  delete(key: string): boolean {
    const entry = this.entries.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.entries.delete(key);
      return false;
    }
    return this.entries.delete(key);
  }

  has(key: string): boolean {
    const entry = this.entries.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.entries.delete(key);
      return false;
    }
    return true;
  }

  clear(): void {
    this.entries.clear();
  }

  invalidate(pattern: string | RegExp): number {
    let count = 0;
    for (const key of this.entries.keys()) {
      const matches =
        typeof pattern === "string" ? key.includes(pattern) : pattern.test(key);
      if (matches) {
        this.entries.delete(key);
        count++;
      }
    }
    return count;
  }

  size(): number {
    for (const [key, entry] of this.entries) {
      if (this.isExpired(entry)) {
        this.entries.delete(key);
      }
    }
    return this.entries.size;
  }
}

export function createCache<T>(defaultTTL: number = 60000): ServerCache<T> {
  return new ServerCache<T>(defaultTTL);
}

export const permissionCache = new ServerCache<Permission[]>(60000);
