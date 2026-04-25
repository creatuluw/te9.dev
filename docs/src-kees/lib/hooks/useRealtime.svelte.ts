/**
 * useRealtime Hook - Svelte 5 rune-based hook for real-time subscriptions
 *
 * Provides:
 * - Automatic subscription management
 * - SSR data initialization
 * - Reactive state updates
 * - Optimistic update helpers
 */

import { onMount, onDestroy } from 'svelte';
import { browser } from '$app/environment';
import { realtimeStore, type SubscriptionState } from '$lib/stores/realtimeStore';

export interface RealtimeOptions<T> {
	/** Initial data from SSR */
	initialData?: T;
	/** Initial version from SSR */
	initialVersion?: string;
	/** Poll interval in ms (default: 10000) */
	interval?: number;
	/** Auto-start polling on mount (default: true) */
	autoStart?: boolean;
}

export interface RealtimeReturn<T> {
	/** Current data */
	data: T | null;
	/** Is currently loading */
	loading: boolean;
	/** Current error message */
	error: string | null;
	/** Current version/etag */
	version: string;
	/** Last update timestamp */
	lastUpdated: number;
	/** Manually refresh data */
	refresh: () => Promise<void>;
	/** Apply optimistic update (returns ID for rollback) */
	updateLocal: (updater: (current: T) => T) => string;
	/** Rollback an optimistic update */
	rollback: (optimisticId: string) => void;
	/** Confirm update after successful server call */
	confirmUpdate: (optimisticId: string, newVersion: string) => void;
	/** Start polling */
	start: () => void;
	/** Stop polling */
	stop: () => void;
}

/**
 * Hook for real-time data subscription
 *
 * @example
 * ```svelte
 * <script>
 *   const { data, loading, updateLocal, confirmUpdate } = useRealtime(
 *     'projects:list',
 *     async () => {
 *       const res = await fetch('/api/realtime/projects');
 *       const json = await res.json();
 *       return { data: json.data, etag: res.headers.get('ETag') };
 *     },
 *     { initialData: data.projects, initialVersion: data._version }
 *   );
 * </script>
 * ```
 */
export function useRealtime<T>(
	key: string,
	fetcher: () => Promise<{ data: T; etag: string }>,
	options: RealtimeOptions<T> = {}
): RealtimeReturn<T> {
	const {
		initialData,
		initialVersion = '',
		interval = 10000,
		autoStart = true
	} = options;

	// Reactive state
	let state = $state<SubscriptionState<T>>({
		data: (initialData ?? null) as T,
		etag: initialVersion,
		version: initialVersion,
		loading: !initialData,
		error: null,
		lastUpdated: initialVersion ? Date.now() : 0
	});

	let unsubscribe: (() => void) | null = null;

	onMount(() => {
		// Initialize store with SSR data
		if (initialData !== undefined && initialVersion) {
			realtimeStore.initialize(key, initialData, initialVersion);
		}

		// Register the fetcher
		realtimeStore.register({
			key,
			fetcher,
			interval
		});

		// Subscribe to updates
		unsubscribe = realtimeStore.subscribe<T>(key, (newState) => {
			state = newState;
		});

		// Start polling if autoStart
		if (autoStart && browser) {
			realtimeStore.start(key);
		}
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	return {
		get data() {
			return state.data;
		},
		get loading() {
			return state.loading;
		},
		get error() {
			return state.error;
		},
		get version() {
			return state.version;
		},
		get lastUpdated() {
			return state.lastUpdated;
		},
		refresh: async () => {
			await realtimeStore.refresh(key);
		},
		updateLocal: (updater: (current: T) => T) => {
			return realtimeStore.updateLocal(key, updater);
		},
		rollback: (optimisticId: string) => {
			realtimeStore.rollback(key, optimisticId);
		},
		confirmUpdate: (optimisticId: string, newVersion: string) => {
			realtimeStore.confirmUpdate(key, optimisticId, newVersion);
		},
		start: () => {
			realtimeStore.start(key);
		},
		stop: () => {
			realtimeStore.stop(key);
		}
	};
}

/**
 * Simplified hook for cases where you just need data + loading state
 */
export function useRealtimeData<T>(
	key: string,
	fetcher: () => Promise<{ data: T; etag: string }>,
	options: RealtimeOptions<T> = {}
): { data: T | null; loading: boolean; error: string | null } {
	const realtime = useRealtime(key, fetcher, options);

	return {
		get data() {
			return realtime.data;
		},
		get loading() {
			return realtime.loading;
		},
		get error() {
			return realtime.error;
		}
	};
}

/**
 * Hook for optimistic updates with automatic rollback on error
 *
 * @example
 * ```typescript
 * const result = await withOptimisticUpdate(
 *   realtime,
 *   async () => {
 *     const res = await fetch('/api/projects/1', { method: 'PATCH', ... });
 *     if (!res.ok) throw new Error('Failed');
 *     return { newVersion: res.headers.get('ETag') };
 *   },
 *   (current) => current.filter(p => p.id !== 1) // Optimistic update
 * );
 * ```
 */
export async function withOptimisticUpdate<T, R>(
	realtime: Pick<RealtimeReturn<T>, 'updateLocal' | 'rollback' | 'confirmUpdate'>,
	serverCall: () => Promise<{ newVersion: string }>,
	optimisticUpdate: (current: T) => T
): Promise<{ success: boolean; error?: string }> {
	const optimisticId = realtime.updateLocal(optimisticUpdate);

	try {
		const result = await serverCall();
		realtime.confirmUpdate(optimisticId, result.newVersion);
		return { success: true };
	} catch (error) {
		realtime.rollback(optimisticId);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}
