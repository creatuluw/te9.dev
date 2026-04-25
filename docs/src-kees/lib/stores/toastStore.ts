/**
 * Toast store - Manages toast notifications
 * 
 * Provides reactive toast notifications with auto-dismiss functionality.
 * Follows standardized store patterns.
 */
import { createStore, createLoggingMiddleware } from './storeFactory';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
	id: string;
	message: string;
	variant: ToastVariant;
	duration?: number;
}

/**
 * Toast store interface
 */
interface ToastStore {
	subscribe: (callback: (toasts: Toast[]) => void) => () => void;
	add: (message: string, variant?: ToastVariant, duration?: number) => string;
	remove: (id: string) => void;
	clear: () => void;
}

/**
 * Create toast store
 * 
 * @returns Toast store instance
 */
function createToastStore(): ToastStore {
	const store = createStore<Toast[]>({
		initialValue: [],
		name: 'toast',
		middleware: [
			createLoggingMiddleware('toast'),
			// Limit max toasts to prevent UI overflow
			(value) => value.length > 10 ? value.slice(-10) : value,
		],
	});

	const activeTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

	return {
		subscribe: store.subscribe,
		/**
		 * Add a toast notification
		 * 
		 * @param message - Toast message to display
		 * @param variant - Toast variant (success, error, warning, info)
		 * @param duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
		 * @returns Toast ID for manual removal
		 * 
		 * @example
		 * ```typescript
		 * const id = toastStore.add('Task completed!', 'success');
		 * // Auto-dismisses after 5 seconds (default)
		 * ```
		 */
		add: (message: string, variant: ToastVariant = 'info', duration: number = 5000): string => {
			const id = Math.random().toString(36).substring(2, 15);
			const toast: Toast = { id, message, variant, duration };

			store.update((toasts) => [...toasts, toast]);

			if (duration > 0) {
				const timeoutId = setTimeout(() => {
					store.update((toasts) => toasts.filter((t) => t.id !== id));
					activeTimeouts.delete(id);
				}, duration);
				activeTimeouts.set(id, timeoutId);
			}

			return id;
		},
		/**
		 * Remove a toast by ID
		 * 
		 * @param id - Toast ID to remove
		 * 
		 * @example
		 * ```typescript
		 * toastStore.remove(toastId);
		 * ```
		 */
		remove: (id: string) => {
			// Clear timeout if exists
			const timeoutId = activeTimeouts.get(id);
			if (timeoutId) {
				clearTimeout(timeoutId);
				activeTimeouts.delete(id);
			}

			store.update((toasts) => toasts.filter((t) => t.id !== id));
		},
		/**
		 * Clear all toasts
		 * 
		 * @example
		 * ```typescript
		 * toastStore.clear();
		 * ```
		 */
		clear: () => {
			// Clear all timeouts
			activeTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
			activeTimeouts.clear();

			store.reset();
		}
	};
}

// Legacy store for backward compatibility
// New code should use toastStore.svelte.ts with $state runes
const legacyStore = createToastStore();

// Import functions from new store for use in legacy store
import { addToast, removeToast, clearToasts } from './toastStore.svelte';

// Re-export from new store for migration
export { toastState, addToast, removeToast, clearToasts } from './toastStore.svelte';

// Legacy store instance (deprecated - use toastStore.svelte.ts instead)
export const toastStore = {
	subscribe: legacyStore.subscribe,
	add: addToast,
	remove: removeToast,
	clear: clearToasts
};

