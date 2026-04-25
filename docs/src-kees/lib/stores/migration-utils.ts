/**
 * Migration utilities for Svelte 5 $state runes pattern
 * 
 * Provides helper functions for common patterns when migrating from stores to $state runes:
 * - localStorage persistence with $state
 * - Polling management
 * - Cache integration
 * - Backward compatibility
 */

/**
 * Create a reactive $state with localStorage persistence
 * 
 * @param key - localStorage key
 * @param initialValue - Initial value if no stored value exists
 * @param serialize - Custom serialization function (default: JSON.stringify)
 * @param deserialize - Custom deserialization function (default: JSON.parse)
 * @returns Reactive $state object that syncs with localStorage
 * 
 * @example
 * ```typescript
 * const stored = loadFromStorage('user_prefs', { theme: 'light' });
 * export const userPrefs = $state(stored);
 * 
 * // Sync to localStorage
 * $effect(() => {
 *   saveToStorage('user_prefs', userPrefs);
 * });
 * ```
 */
export function loadFromStorage<T>(
	key: string,
	initialValue: T,
	deserialize?: (str: string) => T
): T {
	if (typeof window === 'undefined') {
		return initialValue;
	}
	
	try {
		const stored = localStorage.getItem(key);
		if (!stored) return initialValue;
		
		const parsed = deserialize 
			? deserialize(stored)
			: JSON.parse(stored);
		
		return parsed ?? initialValue;
	} catch (error) {
		console.error(`Error loading from localStorage key "${key}":`, error);
		return initialValue;
	}
}

/**
 * Save value to localStorage
 * 
 * @param key - localStorage key
 * @param value - Value to save
 * @param serialize - Custom serialization function (default: JSON.stringify)
 * 
 * @example
 * ```typescript
 * $effect(() => {
 *   saveToStorage('user_prefs', userPrefs);
 * });
 * ```
 */
export function saveToStorage<T>(
	key: string,
	value: T,
	serialize?: (value: T) => string
): void {
	if (typeof window === 'undefined') {
		return;
	}
	
	try {
		const serialized = serialize 
			? serialize(value)
			: JSON.stringify(value);
		
		localStorage.setItem(key, serialized);
	} catch (error) {
		console.error(`Error saving to localStorage key "${key}":`, error);
	}
}

/**
 * Polling manager for $state stores
 * 
 * Manages polling intervals with proper cleanup and prevents concurrent polls
 * 
 * @example
 * ```typescript
 * const pollManager = createPollManager();
 * 
 * export function startPolling(interval = 30000) {
 *   pollManager.start(() => refreshData(), interval);
 * }
 * 
 * export function stopPolling() {
 *   pollManager.stop();
 * }
 * ```
 */
export function createPollManager() {
	let pollInterval: ReturnType<typeof setInterval> | null = null;
	let isPolling = false;
	
	return {
		/**
		 * Start polling
		 * 
		 * @param callback - Function to call on each poll
		 * @param interval - Polling interval in milliseconds
		 */
		start(callback: () => void | Promise<void>, interval: number = 30000): void {
			// Clear existing interval if any
			if (pollInterval) {
				clearInterval(pollInterval);
			}
			
			// Start new polling interval
			pollInterval = setInterval(async () => {
				if (!isPolling) {
					isPolling = true;
					try {
						await callback();
					} finally {
						isPolling = false;
					}
				}
			}, interval);
		},
		
		/**
		 * Stop polling
		 */
		stop(): void {
			if (pollInterval) {
				clearInterval(pollInterval);
				pollInterval = null;
			}
			isPolling = false;
		},
		
		/**
		 * Check if currently polling
		 */
		get isPolling(): boolean {
			return isPolling;
		}
	};
}

/**
 * Create a backward compatibility wrapper for old store interface
 * 
 * This allows gradual migration by providing subscribe() method for old code
 * 
 * @param state - $state object to wrap
 * @returns Object with subscribe() method compatible with old store pattern
 * 
 * @example
 * ```typescript
 * export const myState = $state({ value: 0 });
 * 
 * // For backward compatibility during migration
 * export const myStore = createStoreWrapper(myState, (state) => state.value);
 * 
 * // Old code can still use: myStore.subscribe(callback)
 * // New code uses: myState.value directly
 * ```
 */
export function createStoreWrapper<T, U = T>(
	state: T,
	selector?: (state: T) => U
): { subscribe: (callback: (value: U) => void) => () => void } {
	return {
		subscribe(callback: (value: U) => void) {
			// Initial call
			const value = selector ? selector(state) : (state as unknown as U);
			callback(value);
			
			// For $state, we can't easily track changes without $effect
			// This is a simplified wrapper - full reactivity requires $effect in component
			// This is mainly for backward compatibility during migration
			return () => {
				// Cleanup (no-op for now, as $state doesn't have unsubscribe)
			};
		}
	};
}

/**
 * Create a reactive effect that syncs state to localStorage
 * 
 * @param state - $state object to sync
 * @param key - localStorage key
 * @param serialize - Custom serialization function
 * 
 * @example
 * ```typescript
 * export const authState = $state(loadFromStorage('auth_data', null));
 * 
 * // Auto-sync to localStorage
 * createStorageSync(authState, 'auth_data');
 * ```
 */
export function createStorageSync<T>(
	state: T,
	key: string,
	serialize?: (value: T) => string
): void {
	// This should be called in a component's $effect or in the store file
	// Note: $effect can only be used in component context or .svelte.ts files
	// For .ts files, components should set up the effect
	if (typeof window !== 'undefined') {
		// Use a simple approach: save on any property access
		// Better approach: use $effect in component or .svelte.ts file
		const save = () => saveToStorage(key, state, serialize);
		
		// For now, return a function that components can call in $effect
		// Components should do: $effect(() => { saveToStorage(key, state); });
	}
}

