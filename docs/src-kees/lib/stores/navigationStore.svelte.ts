/**
 * Navigation loading store
 * 
 * **Svelte 5 Runes Pattern:**
 * Uses $state runes for reactive shared state, following Svelte 5 best practices.
 * Components can directly access state properties reactively without subscribe().
 * 
 * Manages the global navigation loading state.
 * Shows a loader during page transitions and page-specific loading operations.
 * 
 * **Centralized Loading System:**
 * All components should notify their loading state to this store instead of
 * showing their own spinners. The global spinner in +layout.svelte will handle
 * all loading states.
 */

/**
 * Reactive navigation state using Svelte 5 $state runes
 * Components can directly access these properties reactively
 */
export const navigationState = $state({
	isLoading: false,
	pageLoadingCount: 0,
	/** Map of component loading IDs to their loading state */
	componentLoading: {} as Record<string, boolean>
});

/**
 * Start global loading state
 * 
 * @example
 * ```typescript
 * startLoading();
 * ```
 */
export function startLoading(): void {
	navigationState.isLoading = true;
}

/**
 * Stop global loading state
 * 
 * @example
 * ```typescript
 * stopLoading();
 * ```
 */
export function stopLoading(): void {
	navigationState.isLoading = false;
	navigationState.pageLoadingCount = 0;
	navigationState.componentLoading = {};
}

/**
 * Register a page-level loading operation
 * Use this when a page component is loading critical data
 * Loading indicator hides when all page operations complete
 * 
 * @example
 * ```typescript
 * startPageLoading();
 * await loadData();
 * stopPageLoading();
 * ```
 */
export function startPageLoading(): void {
	navigationState.isLoading = true;
	navigationState.pageLoadingCount = navigationState.pageLoadingCount + 1;
}

/**
 * Unregister a page-level loading operation
 * Loading indicator hides when all page operations complete
 * 
 * @example
 * ```typescript
 * stopPageLoading();
 * ```
 */
export function stopPageLoading(): void {
	const newCount = Math.max(0, navigationState.pageLoadingCount - 1);
	navigationState.pageLoadingCount = newCount;
	updateLoadingState();
}

/**
 * Register a component-level loading operation
 * Components should use this instead of showing their own spinners
 * 
 * @param componentId - Unique identifier for the component (e.g., 'CaseDrawer', 'UserSelector')
 * @example
 * ```typescript
 * startComponentLoading('CaseDrawer');
 * await loadCase();
 * stopComponentLoading('CaseDrawer');
 * ```
 */
export function startComponentLoading(componentId: string): void {
	navigationState.componentLoading[componentId] = true;
	updateLoadingState();
}

/**
 * Unregister a component-level loading operation
 * 
 * @param componentId - Unique identifier for the component
 * @example
 * ```typescript
 * stopComponentLoading('CaseDrawer');
 * ```
 */
export function stopComponentLoading(componentId: string): void {
	delete navigationState.componentLoading[componentId];
	updateLoadingState();
}

/**
 * Update the global loading state based on all active loading operations
 * The global spinner shows if any page or component is loading
 */
function updateLoadingState(): void {
	const hasPageLoading = navigationState.pageLoadingCount > 0;
	const hasComponentLoading = Object.keys(navigationState.componentLoading).length > 0;
	navigationState.isLoading = hasPageLoading || hasComponentLoading;
}

