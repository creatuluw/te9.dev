/**
 * SvelteKit View Transitions Integration
 * 
 * Integrates view transitions with SvelteKit's navigation system.
 * Provides a reusable pattern for random page transitions during navigation.
 * 
 * @see https://developer.chrome.com/docs/web-platform/view-transitions
 */

import { onNavigate } from '$app/navigation';
import { browser } from '$app/environment';
import type { Navigation } from '@sveltejs/kit';
import {
	supportsViewTransitions,
	selectTransition,
	applyTransitionStyles,
	type TransitionConfig,
	type NavigationContext,
	getPreviousTransitionType,
	setPreviousTransitionType
} from './viewTransitions';

/**
 * Configuration options for SvelteKit view transitions
 */
export interface ViewTransitionsKitOptions {
	/** Available transition types to randomly select from */
	availableTransitions?: Array<
		| 'fade'
		| 'slide-left'
		| 'slide-right'
		| 'slide-up'
		| 'slide-down'
		| 'scale-up'
		| 'scale-down'
		| 'blur'
		| 'flip-x'
		| 'flip-y'
		| 'rotate'
	>;
	/** Use context-based selection instead of random */
	useContext?: boolean;
	/** Force a specific transition type (disables random selection) */
	forcedType?: string;
	/** Whether to enable transitions (useful for feature flags) */
	enabled?: boolean;
	/** Routes to exclude from transitions */
	excludedRoutes?: string[];
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<Omit<ViewTransitionsKitOptions, 'forcedType'>> = {
	availableTransitions: [
		'fade',
		'slide-left',
		'slide-right',
		'slide-up',
		'scale-up',
		'blur'
	],
	useContext: false,
	enabled: true,
	excludedRoutes: []
};

/**
 * Setup view transitions for SvelteKit navigation
 * 
 * This function should be called once in your root layout to enable
 * view transitions across all navigation.
 * 
 * @param options - Configuration options
 * @example
 * ```typescript
 * import { setupViewTransitions } from '$lib/utils/viewTransitionsKit';
 * 
 * setupViewTransitions({
 *   availableTransitions: ['fade', 'slide-left', 'slide-right'],
 *   enabled: true
 * });
 * ```
 */
export function setupViewTransitions(
	options: ViewTransitionsKitOptions = {}
): void {
	if (!browser) return;

	const config = {
		...DEFAULT_OPTIONS,
		...options
	};

	// Exit early if disabled or not supported
	if (!config.enabled || !supportsViewTransitions()) {
		return;
	}

	// Setup navigation hook
	onNavigate((navigation) => {
		// Check if route should be excluded
		const targetRoute = navigation.to?.route.id || '';
		if (config.excludedRoutes.some(route => targetRoute.startsWith(route))) {
			return;
		}

		// Create navigation context
		const context: NavigationContext = {
			navigation,
			previousType: getPreviousTransitionType()
		};

		// Select transition
		const transitionConfig = selectTransition(context, {
			available: config.availableTransitions as any,
			forcedType: config.forcedType as any,
			useContext: config.useContext
		});

		// Store transition type for next navigation
		setPreviousTransitionType(transitionConfig.type);

		// Apply transition styles immediately
		if (browser) {
			applyTransitionStyles(transitionConfig);
		}

		// Return a promise that resolves when navigation completes
		// This ensures the view transition runs during navigation
		return new Promise<void>((resolve) => {
			if (!document.startViewTransition) {
				navigation.complete.then(() => resolve());
				return;
			}

			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
}

/**
 * Create a view transition for programmatic navigation
 * Useful for transitions during loading states or manual navigation
 * 
 * @param callback - Callback to execute during transition
 * @param transitionType - Optional transition type (random if not specified)
 * @returns Promise that resolves when transition completes
 * @example
 * ```typescript
 * import { createNavigationTransition } from '$lib/utils/viewTransitionsKit';
 * 
 * await createNavigationTransition(async () => {
 *   await loadData();
 *   updateUI();
 * });
 * ```
 */
export async function createNavigationTransition(
	callback: () => void | Promise<void>,
	transitionType?: string
): Promise<void> {
	if (!browser || !supportsViewTransitions()) {
		await callback();
		return;
	}

	const { createViewTransition, selectTransition, applyTransitionStyles } = await import(
		'./viewTransitions'
	);

	const context: NavigationContext = {
		navigation: null,
		isLoading: true,
		previousType: getPreviousTransitionType()
	};

	const config = transitionType
		? {
				type: transitionType as any,
				duration: 300,
				easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
		  }
		: selectTransition(context);

	setPreviousTransitionType(config.type);

	await createViewTransition(callback, config);
}

