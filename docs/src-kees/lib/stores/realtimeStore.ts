/**
 * Realtime Store - Centralized real-time subscription management
 *
 * Provides:
 * - Smart polling with ETag-based change detection
 * - Optimistic updates with rollback capability
 * - Version-based conflict detection
 * - Subscription management (start/stop/refresh)
 */

import { browser } from '$app/environment';
import { etagsEqual } from '$lib/utils/etag';

type Subscriber<T> = (state: SubscriptionState<T>) => void;

export interface SubscriptionState<T> {
	data: T;
	etag: string;
	version: string;
	loading: boolean;
	error: string | null;
	lastUpdated: number;
}

interface Subscription<T> {
	config: SubscriptionConfig<T>;
	state: SubscriptionState<T>;
	subscribers: Set<Subscriber<T>>;
	timer: ReturnType<typeof setInterval> | null;
	pendingRequest: Promise<void> | null;
	optimisticUpdates: Map<string, { updater: (current: T) => T; timestamp: number }>;
}

export interface SubscriptionConfig<T> {
	key: string;
	fetcher: () => Promise<{ data: T; etag: string }>;
	interval?: number;
}

const DEFAULT_INTERVAL = 10000; // 10 seconds

class RealtimeStore {
	private subscriptions = new Map<string, Subscription<any>>();

	/**
	 * Subscribe to a realtime data source
	 * Returns unsubscribe function
	 */
	subscribe<T>(key: string, callback: Subscriber<T>): () => void {
		const subscription = this.subscriptions.get(key);

		if (!subscription) {
			console.warn(`[RealtimeStore] No subscription found for key: ${key}. Call initialize() first.`);
			return () => {};
		}

		subscription.subscribers.add(callback);

		// Immediately call with current state
		callback(subscription.state as SubscriptionState<T>);

		return () => {
			subscription.subscribers.delete(callback);

			// Stop polling if no more subscribers
			if (subscription.subscribers.size === 0) {
				this.stop(key);
			}
		};
	}

	/**
	 * Initialize a subscription with SSR data
	 */
	initialize<T>(key: string, data: T, version: string): void {
		const existing = this.subscriptions.get(key);

		if (existing) {
			// Update existing subscription with new SSR data
			existing.state = {
				data,
				etag: version,
				version,
				loading: false,
				error: null,
				lastUpdated: Date.now()
			};
			this.notifySubscribers(key);
		} else {
			// Create new subscription with SSR data (no fetcher yet)
			this.subscriptions.set(key, {
				config: {
					key,
					fetcher: async () => ({ data, etag: version }),
					interval: DEFAULT_INTERVAL
				},
				state: {
					data,
					etag: version,
					version,
					loading: false,
					error: null,
					lastUpdated: Date.now()
				},
				subscribers: new Set(),
				timer: null,
				pendingRequest: null,
				optimisticUpdates: new Map()
			});
		}
	}

	/**
	 * Register a subscription with its fetcher
	 */
	register<T>(config: SubscriptionConfig<T>): void {
		const existing = this.subscriptions.get(config.key);

		if (existing) {
			// Update config (keep state)
			existing.config = config;
		} else {
			// Create new subscription
			this.subscriptions.set(config.key, {
				config,
				state: {
					data: null as T,
					etag: '',
					version: '',
					loading: true,
					error: null,
					lastUpdated: 0
				},
				subscribers: new Set(),
				timer: null,
				pendingRequest: null,
				optimisticUpdates: new Map()
			});
		}
	}

	/**
	 * Start polling for a subscription
	 */
	start(key: string): void {
		const subscription = this.subscriptions.get(key);
		if (!subscription) {
			console.warn(`[RealtimeStore] Cannot start: no subscription for key: ${key}`);
			return;
		}

		// Don't start if already running
		if (subscription.timer) {
			return;
		}

		// Don't start in SSR
		if (!browser) {
			return;
		}

		// Start polling
		const interval = subscription.config.interval || DEFAULT_INTERVAL;
		subscription.timer = setInterval(() => {
			this.poll(key);
		}, interval);

		if (import.meta.env.DEV) {
			console.log(`[RealtimeStore] Started polling for: ${key} (interval: ${interval}ms)`);
		}
	}

	/**
	 * Stop polling for a subscription (keeps subscription data)
	 */
	stop(key: string): void {
		const subscription = this.subscriptions.get(key);
		if (!subscription) return;

		if (subscription.timer) {
			clearInterval(subscription.timer);
			subscription.timer = null;

			if (import.meta.env.DEV) {
				console.log(`[RealtimeStore] Stopped polling for: ${key}`);
			}
		}
	}

	/**
	 * Force refresh a subscription (user action)
	 */
	async refresh(key: string): Promise<void> {
		const subscription = this.subscriptions.get(key);
		if (!subscription) return;

		// Clear optimistic updates
		subscription.optimisticUpdates.clear();

		await this.poll(key, true);
	}

	/**
	 * Poll for updates
	 */
	private async poll(key: string, force = false): Promise<void> {
		const subscription = this.subscriptions.get(key);
		if (!subscription) return;

		// Don't poll if already in progress (unless forced)
		if (subscription.pendingRequest && !force) {
			return;
		}

		// Don't poll in SSR
		if (!browser) return;

		subscription.state.loading = true;
		this.notifySubscribers(key);

		try {
			const result = await subscription.config.fetcher();

			// Check if data changed (ETag comparison)
			const hasChanged = !etagsEqual(result.etag, subscription.state.etag);

			if (hasChanged || force) {
				// Update state with new data
				subscription.state = {
					data: result.data,
					etag: result.etag,
					version: result.etag,
					loading: false,
					error: null,
					lastUpdated: Date.now()
				};

				// Clear optimistic updates since we have fresh data
				subscription.optimisticUpdates.clear();

				if (import.meta.env.DEV) {
					console.log(`[RealtimeStore] Data updated for: ${key}`);
				}
			} else {
				subscription.state.loading = false;
			}
		} catch (error) {
			console.error(`[RealtimeStore] Poll error for ${key}:`, error);
			subscription.state.error = error instanceof Error ? error.message : 'Unknown error';
			subscription.state.loading = false;
		}

		this.notifySubscribers(key);
	}

	/**
	 * Optimistic local update
	 * Returns optimistic ID for potential rollback
	 */
	updateLocal<T>(key: string, updater: (current: T) => T): string {
		const subscription = this.subscriptions.get(key);
		if (!subscription) {
			console.warn(`[RealtimeStore] Cannot update: no subscription for key: ${key}`);
			return '';
		}

		const optimisticId = `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		// Store the optimistic update
		subscription.optimisticUpdates.set(optimisticId, {
			updater: updater as (current: unknown) => unknown,
			timestamp: Date.now()
		});

		// Apply optimistic update to current state
		try {
			const currentData = subscription.state.data;
			const newData = updater(currentData);

			subscription.state = {
				...subscription.state,
				data: newData,
				lastUpdated: Date.now()
			};

			this.notifySubscribers(key);

			if (import.meta.env.DEV) {
				console.log(`[RealtimeStore] Optimistic update applied: ${optimisticId}`);
			}
		} catch (error) {
			console.error(`[RealtimeStore] Optimistic update failed:`, error);
			subscription.optimisticUpdates.delete(optimisticId);
		}

		return optimisticId;
	}

	/**
	 * Rollback an optimistic update
	 */
	rollback(key: string, optimisticId: string): void {
		const subscription = this.subscriptions.get(key);
		if (!subscription) return;

		const update = subscription.optimisticUpdates.get(optimisticId);
		if (!update) {
			console.warn(`[RealtimeStore] No optimistic update found: ${optimisticId}`);
			return;
		}

		subscription.optimisticUpdates.delete(optimisticId);

		if (import.meta.env.DEV) {
			console.log(`[RealtimeStore] Rolled back optimistic update: ${optimisticId}`);
		}

		// Note: We can't truly "undo" the update without storing the previous state
		// Instead, we trigger a refresh to get the server state
		this.refresh(key);
	}

	/**
	 * Confirm an optimistic update after successful server call
	 */
	confirmUpdate(key: string, optimisticId: string, newVersion: string): void {
		const subscription = this.subscriptions.get(key);
		if (!subscription) return;

		subscription.optimisticUpdates.delete(optimisticId);

		// Update version/etag
		subscription.state.etag = newVersion;
		subscription.state.version = newVersion;
		subscription.state.lastUpdated = Date.now();

		if (import.meta.env.DEV) {
			console.log(`[RealtimeStore] Confirmed update: ${optimisticId}, new version: ${newVersion}`);
		}
	}

	/**
	 * Get current state for a subscription
	 */
	getState<T>(key: string): SubscriptionState<T> | undefined {
		const subscription = this.subscriptions.get(key);
		return subscription?.state as SubscriptionState<T> | undefined;
	}

	/**
	 * Check if a subscription exists
	 */
	has(key: string): boolean {
		return this.subscriptions.has(key);
	}

	/**
	 * Completely remove a subscription
	 */
	destroy(key: string): void {
		this.stop(key);
		this.subscriptions.delete(key);

		if (import.meta.env.DEV) {
			console.log(`[RealtimeStore] Destroyed subscription: ${key}`);
		}
	}

	/**
	 * Notify all subscribers of state change
	 */
	private notifySubscribers(key: string): void {
		const subscription = this.subscriptions.get(key);
		if (!subscription) return;

		const state = subscription.state;
		for (const callback of subscription.subscribers) {
			try {
				callback(state);
			} catch (error) {
				console.error(`[RealtimeStore] Subscriber callback error for ${key}:`, error);
			}
		}
	}

	/**
	 * Get debug info
	 */
	getDebugInfo(): Record<string, { subscriberCount: number; timer: boolean; lastUpdated: number }> {
		const info: Record<string, { subscriberCount: number; timer: boolean; lastUpdated: number }> = {};

		for (const [key, sub] of this.subscriptions) {
			info[key] = {
				subscriberCount: sub.subscribers.size,
				timer: !!sub.timer,
				lastUpdated: sub.state.lastUpdated
			};
		}

		return info;
	}
}

// Export singleton instance
export const realtimeStore = new RealtimeStore();

// Also export class for testing
export { RealtimeStore };
