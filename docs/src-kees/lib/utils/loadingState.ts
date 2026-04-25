/**
 * Loading State Utility
 * 
 * Provides easy-to-use utilities for components to notify their loading state
 * to the centralized loading system. Components should use these functions instead
 * of managing their own spinners.
 * 
 * **Usage Pattern:**
 * ```typescript
 * import { useLoadingState } from '$lib/utils/loadingState';
 * 
 * const { startLoading, stopLoading } = useLoadingState('MyComponent');
 * 
 * async function loadData() {
 *   startLoading();
 *   try {
 *     await fetchData();
 *   } finally {
 *     stopLoading();
 *   }
 * }
 * ```
 */

import { startComponentLoading, stopComponentLoading } from '$lib/stores/navigationStore.svelte';

/**
 * Generate a unique component ID for loading state tracking
 * Uses component name and optional suffix for multiple loading operations
 * 
 * @param componentName - Name of the component (e.g., 'CaseDrawer', 'UserSelector')
 * @param suffix - Optional suffix for multiple loading operations in same component (e.g., 'users', 'files')
 * @returns Unique component ID
 */
function getComponentId(componentName: string, suffix?: string): string {
	return suffix ? `${componentName}:${suffix}` : componentName;
}

/**
 * Hook for components to easily manage their loading state
 * Returns functions to start and stop loading for this component
 * 
 * @param componentName - Name of the component
 * @param suffix - Optional suffix for multiple loading operations
 * @returns Object with startLoading and stopLoading functions
 * 
 * @example
 * ```typescript
 * const { startLoading, stopLoading } = useLoadingState('CaseDrawer');
 * 
 * async function loadCase() {
 *   startLoading();
 *   try {
 *     await fetchCase();
 *   } finally {
 *     stopLoading();
 *   }
 * }
 * ```
 */
export function useLoadingState(componentName: string, suffix?: string) {
	const componentId = getComponentId(componentName, suffix);
	
	return {
		/**
		 * Start loading state for this component
		 */
		startLoading: () => startComponentLoading(componentId),
		
		/**
		 * Stop loading state for this component
		 */
		stopLoading: () => stopComponentLoading(componentId),
		
		/**
		 * Get the component ID (useful for debugging)
		 */
		componentId
	};
}

/**
 * Execute an async function with loading state management
 * Automatically starts loading before execution and stops after completion
 * 
 * @param componentName - Name of the component
 * @param asyncFn - Async function to execute
 * @param suffix - Optional suffix for multiple loading operations
 * @returns Promise that resolves with the result of asyncFn
 * 
 * @example
 * ```typescript
 * const result = await withLoading('CaseDrawer', async () => {
 *   return await fetchCase();
 * });
 * ```
 */
export async function withLoading<T>(
	componentName: string,
	asyncFn: () => Promise<T>,
	suffix?: string
): Promise<T> {
	const { startLoading, stopLoading } = useLoadingState(componentName, suffix);
	
	startLoading();
	try {
		return await asyncFn();
	} finally {
		stopLoading();
	}
}

/**
 * Create a loading state manager for a component with multiple loading operations
 * Useful when a component has multiple independent loading states
 * 
 * @param componentName - Name of the component
 * @returns Object with methods to manage multiple loading states
 * 
 * @example
 * ```typescript
 * const loading = createLoadingManager('BacklogDrawer');
 * 
 * async function loadUsers() {
 *   loading.start('users');
 *   try {
 *     await fetchUsers();
 *   } finally {
 *     loading.stop('users');
 *   }
 * }
 * 
 * async function loadCases() {
 *   loading.start('cases');
 *   try {
 *     await fetchCases();
 *   } finally {
 *     loading.stop('cases');
 *   }
 * }
 * ```
 */
export function createLoadingManager(componentName: string) {
	return {
		/**
		 * Start loading for a specific operation
		 */
		start: (suffix: string) => startComponentLoading(getComponentId(componentName, suffix)),
		
		/**
		 * Stop loading for a specific operation
		 */
		stop: (suffix: string) => stopComponentLoading(getComponentId(componentName, suffix)),
		
		/**
		 * Execute an async function with loading state
		 */
		withLoading: <T>(suffix: string, asyncFn: () => Promise<T>): Promise<T> => {
			return withLoading(componentName, asyncFn, suffix);
		}
	};
}

















