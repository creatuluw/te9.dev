/**
 * Toast store - Manages toast notifications
 * 
 * **Svelte 5 Runes Pattern:**
 * Uses $state runes for reactive shared state, following Svelte 5 best practices.
 * Components can directly access state properties reactively without subscribe().
 * 
 * Provides reactive toast notifications with auto-dismiss functionality.
 */
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
	id: string;
	message: string;
	variant: ToastVariant;
	duration?: number;
}

/**
 * Reactive toast state using Svelte 5 $state runes
 * Components can directly access these properties reactively
 */
export const toastState = $state({
	toasts: [] as Toast[]
});

// Track active timeouts for auto-dismiss
const activeTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Generate a unique ID for a toast
 */
function generateId(): string {
	return Math.random().toString(36).substring(2, 15);
}

/**
 * Add a toast notification
 * 
 * @param message - Toast message to display
 * @param variant - Toast variant (success, error, warning, info)
 * @param duration - Auto-dismiss duration in ms (0 = no auto-dismiss, default: 5000)
 * @returns Toast ID for manual removal
 * 
 * @example
 * ```typescript
 * const id = addToast('Task completed!', 'success');
 * // Auto-dismisses after 5 seconds (default)
 * ```
 */
export function addToast(
	message: string, 
	variant: ToastVariant = 'info', 
	duration: number = 5000
): string {
	const id = generateId();
	const toast: Toast = { id, message, variant, duration };
	
	// Update state reactively
	toastState.toasts = [...toastState.toasts, toast];
	
	// Set up auto-dismiss if duration > 0
	if (duration > 0) {
		const timeoutId = setTimeout(() => {
			removeToast(id);
		}, duration);
		activeTimeouts.set(id, timeoutId);
	}
	
	return id;
}

/**
 * Remove a toast by ID
 * 
 * @param id - Toast ID to remove
 * 
 * @example
 * ```typescript
 * removeToast(toastId);
 * ```
 */
export function removeToast(id: string): void {
	// Clear timeout if exists
	const timeoutId = activeTimeouts.get(id);
	if (timeoutId) {
		clearTimeout(timeoutId);
		activeTimeouts.delete(id);
	}
	
	// Update state reactively
	toastState.toasts = toastState.toasts.filter((t) => t.id !== id);
}

/**
 * Clear all toasts
 * 
 * @example
 * ```typescript
 * clearToasts();
 * ```
 */
export function clearToasts(): void {
	// Clear all timeouts
	activeTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
	activeTimeouts.clear();
	
	// Update state reactively
	toastState.toasts = [];
}

