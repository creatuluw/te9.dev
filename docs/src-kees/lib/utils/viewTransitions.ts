/**
 * View Transitions Utility
 * 
 * Provides reusable patterns for random page transitions using the View Transitions API.
 * Integrates with SvelteKit navigation and loading states for smooth animated transitions.
 * 
 * @see https://developer.chrome.com/docs/web-platform/view-transitions
 */

import { browser } from '$app/environment';
import type { Navigation } from '@sveltejs/kit';

/**
 * Available transition animation types
 */
export type TransitionType =
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
	| 'rotate';

/**
 * Transition configuration
 */
export interface TransitionConfig {
	/** Transition type to use */
	type: TransitionType;
	/** Duration in milliseconds */
	duration?: number;
	/** Easing function */
	easing?: string;
	/** Whether to apply transition immediately */
	immediate?: boolean;
}

/**
 * Navigation context for transitions
 */
export interface NavigationContext {
	/** Navigation object from SvelteKit */
	navigation: Navigation | null;
	/** Whether this is a loading transition (not navigation) */
	isLoading?: boolean;
	/** Previous transition type (to avoid immediate repeats) */
	previousType?: TransitionType;
}

/**
 * Default transition configurations
 */
const DEFAULT_TRANSITIONS: TransitionType[] = [
	'fade',
	'slide-left',
	'slide-right',
	'slide-up',
	'scale-up',
	'blur'
];

/**
 * Transition durations (in milliseconds)
 */
const TRANSITION_DURATIONS: Record<TransitionType, number> = {
	'fade': 300,
	'slide-left': 400,
	'slide-right': 400,
	'slide-up': 400,
	'slide-down': 400,
	'scale-up': 350,
	'scale-down': 350,
	'blur': 400,
	'flip-x': 500,
	'flip-y': 500,
	'rotate': 600
};

/**
 * Check if View Transitions API is supported
 */
export function supportsViewTransitions(): boolean {
	if (!browser) return false;
	return typeof document !== 'undefined' && 'startViewTransition' in document;
}

/**
 * Get a random transition type from available transitions
 * Avoids immediately repeating the previous transition
 * 
 * @param available - Array of transition types to choose from
 * @param previous - Previous transition type to avoid
 * @returns Random transition type
 */
export function getRandomTransition(
	available: TransitionType[] = DEFAULT_TRANSITIONS,
	previous?: TransitionType
): TransitionType {
	if (available.length === 0) return 'fade';
	
	// Filter out previous type if provided
	const choices = previous && available.length > 1
		? available.filter(type => type !== previous)
		: available;
	
	// Select random transition
	const randomIndex = Math.floor(Math.random() * choices.length);
	return choices[randomIndex];
}

/**
 * Select transition type based on navigation context
 * Can use random selection or context-based logic
 * 
 * @param context - Navigation context
 * @param options - Transition options
 * @returns Transition configuration
 */
export function selectTransition(
	context: NavigationContext,
	options: {
		/** Available transition types */
		available?: TransitionType[];
		/** Force a specific transition type */
		forcedType?: TransitionType;
		/** Use context-based selection instead of random */
		useContext?: boolean;
	} = {}
): TransitionConfig {
	const {
		available = DEFAULT_TRANSITIONS,
		forcedType,
		useContext = false
	} = options;

	// Use forced type if provided
	if (forcedType) {
		return {
			type: forcedType,
			duration: TRANSITION_DURATIONS[forcedType],
			easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
		};
	}

	// Context-based selection (e.g., based on navigation direction)
	let selectedType: TransitionType;
	
	if (useContext && context.navigation) {
		selectedType = selectTransitionFromContext(context);
	} else {
		// Random selection (default)
		selectedType = getRandomTransition(available, context.previousType);
	}

	return {
		type: selectedType,
		duration: TRANSITION_DURATIONS[selectedType],
		easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
	};
}

/**
 * Select transition based on navigation context
 * Uses navigation direction, route changes, etc.
 */
function selectTransitionFromContext(context: NavigationContext): TransitionType {
	const { navigation } = context;
	
	if (!navigation || !navigation.from || !navigation.to) {
		return getRandomTransition();
	}

	const fromRoute = navigation.from.route.id || '';
	const toRoute = navigation.to.route.id || '';
	
	// Slide right when going to detail pages
	if (fromRoute && toRoute && !fromRoute.includes('[') && toRoute.includes('[')) {
		return 'slide-left';
	}
	
	// Slide left when going back to list pages
	if (fromRoute && toRoute && fromRoute.includes('[') && !toRoute.includes('[')) {
		return 'slide-right';
	}
	
	// Default to random
	return getRandomTransition();
}

/**
 * Apply CSS data attribute for the transition
 * 
 * @param config - Transition configuration
 */
export function applyTransitionStyles(config: TransitionConfig): void {
	if (!browser) return;
	
	const root = document.documentElement;
	
	// Set transition type as data attribute (more reliable than inline styles)
	root.setAttribute('data-transition-type', config.type);
	root.style.setProperty(
		'--view-transition-duration',
		`${config.duration || 300}ms`
	);
	root.style.setProperty(
		'--view-transition-easing',
		config.easing || 'cubic-bezier(0.4, 0, 0.2, 1)'
	);
}

/**
 * Clear transition styles
 */
export function clearTransitionStyles(): void {
	if (!browser) return;
	
	const root = document.documentElement;
	root.removeAttribute('data-transition-type');
	root.style.removeProperty('--view-transition-duration');
	root.style.removeProperty('--view-transition-easing');
}

/**
 * Create a view transition wrapper
 * Handles browser support and fallback
 * 
 * @param callback - Callback to execute during transition
 * @param config - Transition configuration
 * @returns Promise that resolves when transition completes
 */
export async function createViewTransition(
	callback: () => void | Promise<void>,
	config?: TransitionConfig
): Promise<void> {
	if (!supportsViewTransitions()) {
		// Fallback: execute callback without transition
		await callback();
		return;
	}

	// Apply transition styles if config provided
	if (config) {
		applyTransitionStyles(config);
	}

	// Start view transition
	const transition = document.startViewTransition(async () => {
		await callback();
	});

	// Wait for transition to complete
	await transition.finished;
	
	// Clean up styles after transition
	if (config) {
		setTimeout(() => {
			clearTransitionStyles();
		}, config.duration || 300);
	}
}

/**
 * Store for tracking previous transition type
 */
let previousTransitionType: TransitionType | undefined = undefined;

/**
 * Get the last used transition type
 */
export function getPreviousTransitionType(): TransitionType | undefined {
	return previousTransitionType;
}

/**
 * Set the last used transition type
 */
export function setPreviousTransitionType(type: TransitionType): void {
	previousTransitionType = type;
}

/**
 * Reset transition history
 */
export function resetTransitionHistory(): void {
	previousTransitionType = undefined;
}

