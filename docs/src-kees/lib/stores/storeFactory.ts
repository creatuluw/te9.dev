/**
 * Store factory utilities for creating standardized Svelte stores
 * 
 * Provides a consistent pattern for creating stores with middleware support,
 * logging, and type safety.
 */

import { writable, type Writable } from 'svelte/store';
import type { Readable } from 'svelte/store';

/**
 * Store middleware function type
 * Receives the current value and can transform it or perform side effects
 */
export type StoreMiddleware<T> = (value: T, action: string) => T | void;

/**
 * Store configuration options
 */
export interface StoreConfig<T> {
	initialValue: T;
	middleware?: StoreMiddleware<T>[];
	name?: string; // For logging/DevTools
	persist?: {
		key: string;
		storage?: Storage; // Default: localStorage
		serialize?: (value: T) => string;
		deserialize?: (str: string) => T;
	};
}

/**
 * Enhanced store with additional methods
 */
export interface EnhancedStore<T> extends Readable<T> {
	set: (value: T) => void;
	update: (fn: (value: T) => T) => void;
	reset: () => void;
	getValue: () => T;
}

/**
 * Create an enhanced writable store with middleware support
 * 
 * @param config - Store configuration
 * @returns Enhanced store with middleware support
 * 
 * @example
 * ```typescript
 * const store = createStore({
 *   initialValue: { count: 0 },
 *   name: 'counter',
 *   middleware: [
 *     (value, action) => console.log(`${action}:`, value)
 *   ]
 * });
 * ```
 */
export function createStore<T>(config: StoreConfig<T>): EnhancedStore<T> {
	const { initialValue, middleware = [], name, persist } = config;

	// Load persisted value if available
	let persistedValue: T | null = null;
	if (persist && typeof window !== 'undefined') {
		try {
			const storage = persist.storage || localStorage;
			const stored = storage.getItem(persist.key);
			if (stored) {
				persistedValue = persist.deserialize
					? persist.deserialize(stored)
					: JSON.parse(stored);
			}
		} catch (error) {
			console.error(`Error loading persisted value for ${persist.key}:`, error);
		}
	}

	const { subscribe, set: originalSet, update: originalUpdate } = writable<T>(
		persistedValue ?? initialValue
	);

	let currentValue: T = persistedValue ?? initialValue;

	// Apply middleware and set value
	function applyMiddleware(value: T, action: string): T {
		let result = value;
		for (const mw of middleware) {
			const mwResult = mw(result, action);
			if (mwResult !== undefined) {
				result = mwResult;
			}
		}
		return result;
	}

	// Persist value if configured
	function persistValue(value: T): void {
		if (persist && typeof window !== 'undefined') {
			try {
				const storage = persist.storage || localStorage;
				const serialized = persist.serialize
					? persist.serialize(value)
					: JSON.stringify(value);
				storage.setItem(persist.key, serialized);
			} catch (error) {
				console.error(`Error persisting value for ${persist.key}:`, error);
			}
		}
	}

	return {
		subscribe,
		set: (value: T) => {
			const processed = applyMiddleware(value, 'set');
			currentValue = processed;
			originalSet(processed);
			persistValue(processed);
		// Commented out: verbose store update logs
		// if (name && import.meta.env.DEV) {
		// 	console.log(`[${name}] set:`, processed);
		// }
		},
		update: (fn: (value: T) => T) => {
			originalUpdate((value) => {
				const newValue = fn(value);
				// Skip update if nothing actually changed (for workItem store)
				// This prevents infinite loops and unnecessary re-renders
				if (name === 'workItem' && typeof newValue === 'object' && newValue !== null && typeof currentValue === 'object' && currentValue !== null) {
					const current = currentValue as any;
					const updated = newValue as any;
					
					// Compare all relevant fields using JSON.stringify for deep equality
					// This is safe because we're comparing arrays/objects that should be serializable
					const currentJson = JSON.stringify({
						planningItems: current.planningItems,
						backlogItems: current.backlogItems,
						loading: current.loading,
						syncing: current.syncing,
						lastFetch: current.lastFetch
					});
					const updatedJson = JSON.stringify({
						planningItems: updated.planningItems,
						backlogItems: updated.backlogItems,
						loading: updated.loading,
						syncing: updated.syncing,
						lastFetch: updated.lastFetch
					});
					
					// If nothing changed, skip update to prevent unnecessary re-renders
					// This is critical for preventing infinite loops in reactive systems
					if (currentJson === updatedJson) {
						return currentValue;
					}
				}
				const processed = applyMiddleware(newValue, 'update');
				currentValue = processed;
				persistValue(processed);
				// Commented out: verbose store update logs
				// if (name && import.meta.env.DEV) {
				// 	console.log(`[${name}] update:`, processed);
				// }
				return processed;
			});
		},
		reset: () => {
			const processed = applyMiddleware(initialValue, 'reset');
			currentValue = processed;
			originalSet(processed);
			persistValue(processed);
		// Commented out: verbose store reset logs
		// if (name && import.meta.env.DEV) {
		// 	console.log(`[${name}] reset`);
		// }
		},
		getValue: () => currentValue,
	};
}

/**
 * Create a middleware that logs store changes (dev only)
 * 
 * @param storeName - Name of the store for logging
 * @returns Middleware function
 */
export function createLoggingMiddleware<T>(storeName: string): StoreMiddleware<T> {
	return (value: T, action: string) => {
		// Commented out: verbose store middleware logs
		// if (import.meta.env.DEV) {
		// 	console.log(`[Store:${storeName}] ${action}:`, value);
		// }
	};
}

/**
 * Create a middleware that validates store values
 * 
 * @param validator - Validation function that returns true if value is valid
 * @param errorMessage - Error message if validation fails
 * @returns Middleware function
 */
export function createValidationMiddleware<T>(
	validator: (value: T) => boolean,
	errorMessage: string = 'Invalid store value'
): StoreMiddleware<T> {
	return (value: T) => {
		if (!validator(value)) {
			console.error(errorMessage, value);
			throw new Error(errorMessage);
		}
	};
}

