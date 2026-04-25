/**
 * Persistent Cache - localStorage-based cache with optimistic updates
 * 
 * Provides persistent caching for tasks, cases, projects with:
 * - localStorage persistence (survives page reloads)
 * - Optimistic updates (write immediately)
 * - Background sync support
 * - Conflict resolution
 */

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	version: number; // For conflict resolution
	optimistic?: boolean; // True if not yet synced with server
}

interface PendingMutation {
	id: string;
	type: 'create' | 'update' | 'delete';
	entityType: 'case' | 'task' | 'project' | 'process' | 'workitem';
	entityId?: number;
	data: any;
	timestamp: number;
	retries: number;
}

class PersistentCache {
	private prefix = 'bpm_cache_';
	private mutationQueueKey = 'bpm_mutations';
	private maxRetries = 3;
	
	/**
	 * Get cached data for an entity type
	 */
	get<T>(key: string): T | null {
		if (typeof window === 'undefined') return null;
		
		try {
			const stored = localStorage.getItem(`${this.prefix}${key}`);
			if (!stored) return null;
			
			const entry: CacheEntry<T> = JSON.parse(stored);
			return entry.data;
		} catch (error) {
			console.error(`[PersistentCache] Error reading ${key}:`, error);
			return null;
		}
	}
	
	/**
	 * Set cached data (optimistic or confirmed)
	 */
	set<T>(key: string, data: T, optimistic = false): void {
		if (typeof window === 'undefined') return;
		
		try {
			const entry: CacheEntry<T> = {
				data,
				timestamp: Date.now(),
				version: this.getVersion(key) + 1,
				optimistic
			};
			
			localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(entry));
		} catch (error) {
			console.error(`[PersistentCache] Error writing ${key}:`, error);
			// Handle quota exceeded - clear old entries
			if (error instanceof DOMException && error.name === 'QuotaExceededError') {
				this.clearOldEntries();
				// Retry once
				try {
					const entry: CacheEntry<T> = {
						data,
						timestamp: Date.now(),
						version: this.getVersion(key) + 1,
						optimistic
					};
					localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(entry));
				} catch (retryError) {
					console.error(`[PersistentCache] Retry failed for ${key}:`, retryError);
				}
			}
		}
	}
	
	/**
	 * Get version number for conflict resolution
	 */
	private getVersion(key: string): number {
		try {
			const stored = localStorage.getItem(`${this.prefix}${key}`);
			if (!stored) return 0;
			const entry = JSON.parse(stored);
			return entry.version || 0;
		} catch {
			return 0;
		}
	}
	
	/**
	 * Check if entry is optimistic (not synced)
	 */
	isOptimistic(key: string): boolean {
		try {
			const stored = localStorage.getItem(`${this.prefix}${key}`);
			if (!stored) return false;
			const entry = JSON.parse(stored);
			return entry.optimistic === true;
		} catch {
			return false;
		}
	}
	
	/**
	 * Mark entry as confirmed (synced with server)
	 */
	confirm(key: string): void {
		try {
			const stored = localStorage.getItem(`${this.prefix}${key}`);
			if (!stored) return;
			
			const entry = JSON.parse(stored);
			entry.optimistic = false;
			localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(entry));
		} catch (error) {
			console.error(`[PersistentCache] Error confirming ${key}:`, error);
		}
	}
	
	/**
	 * Add mutation to queue for background sync
	 */
	queueMutation(mutation: Omit<PendingMutation, 'id' | 'timestamp' | 'retries'>): void {
		if (typeof window === 'undefined') return;
		
		const pendingMutation: PendingMutation = {
			...mutation,
			id: `${mutation.entityType}_${mutation.entityId || Date.now()}_${Math.random()}`,
			timestamp: Date.now(),
			retries: 0
		};
		
		const queue = this.getMutationQueue();
		queue.push(pendingMutation);
		this.saveMutationQueue(queue);
	}
	
	/**
	 * Get pending mutations queue
	 */
	getMutationQueue(): PendingMutation[] {
		if (typeof window === 'undefined') return [];
		
		try {
			const stored = localStorage.getItem(this.mutationQueueKey);
			if (!stored) return [];
			return JSON.parse(stored);
		} catch {
			return [];
		}
	}
	
	/**
	 * Remove mutation from queue (after successful sync)
	 */
	removeMutation(mutationId: string): void {
		const queue = this.getMutationQueue();
		const filtered = queue.filter(m => m.id !== mutationId);
		this.saveMutationQueue(filtered);
	}
	
	/**
	 * Increment retry count for failed mutation
	 */
	incrementRetry(mutationId: string): void {
		const queue = this.getMutationQueue();
		const mutation = queue.find(m => m.id === mutationId);
		if (mutation) {
			mutation.retries++;
			this.saveMutationQueue(queue);
		}
	}
	
	/**
	 * Save mutation queue
	 */
	private saveMutationQueue(queue: PendingMutation[]): void {
		if (typeof window === 'undefined') return;
		
		try {
			localStorage.setItem(this.mutationQueueKey, JSON.stringify(queue));
		} catch (error) {
			console.error('[PersistentCache] Error saving mutation queue:', error);
		}
	}
	
	/**
	 * Invalidate cache entries matching pattern
	 */
	invalidate(pattern: string | RegExp): void {
		if (typeof window === 'undefined') return;
		
		const keys: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.startsWith(this.prefix)) {
				const cacheKey = key.replace(this.prefix, '');
				const matches = typeof pattern === 'string'
					? cacheKey.includes(pattern)
					: pattern.test(cacheKey);
				
				if (matches) {
					keys.push(key);
				}
			}
		}
		
		keys.forEach(key => localStorage.removeItem(key));
	}
	
	/**
	 * Clear old entries when storage quota exceeded
	 */
	private clearOldEntries(): void {
		const entries: Array<{ key: string; timestamp: number }> = [];
		
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.startsWith(this.prefix)) {
				try {
					const stored = localStorage.getItem(key);
					if (stored) {
						const entry = JSON.parse(stored);
						entries.push({ key, timestamp: entry.timestamp || 0 });
					}
				} catch {
					// Skip invalid entries
				}
			}
		}
		
		// Sort by timestamp, remove oldest 20%
		entries.sort((a, b) => a.timestamp - b.timestamp);
		const toRemove = Math.floor(entries.length * 0.2);
		
		for (let i = 0; i < toRemove; i++) {
			localStorage.removeItem(entries[i].key);
		}
	}
	
	/**
	 * Clear all cache entries
	 */
	clear(): void {
		if (typeof window === 'undefined') return;
		
		const keys: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.startsWith(this.prefix)) {
				keys.push(key);
			}
		}
		
		keys.forEach(key => localStorage.removeItem(key));
		localStorage.removeItem(this.mutationQueueKey);
	}
}

export const persistentCache = new PersistentCache();

