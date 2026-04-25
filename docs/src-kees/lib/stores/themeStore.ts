/**
 * Theme store for managing theme state and persistence
 * Provides reactive theme management with localStorage sync
 */

import { writable } from 'svelte/store';
import type { Theme, ThemeId } from '$lib/types/theme';
import { applyTheme, loadThemePreference, saveThemePreference, validateTheme } from '$lib/utils/theme';
import { themes } from '$lib/themes';

// Use the themes from the registry
const THEMES: Record<ThemeId, Theme> = themes;

/**
 * Creates the theme store with reactive state management
 */
function createThemeStore() {
	const { subscribe, set, update } = writable<ThemeId>('default');

	return {
		subscribe,
		/**
		 * Sets the active theme
		 * @param themeId - The theme ID to activate
		 */
		setTheme: (themeId: ThemeId) => {
			if (!validateTheme(themeId)) {
				console.warn(`Invalid theme ID: ${themeId}, falling back to default`);
				themeId = 'default';
			}

			const theme = THEMES[themeId];
			if (!theme) {
				console.warn(`Theme ${themeId} not found, falling back to default`);
				themeId = 'default';
				const fallbackTheme = THEMES.default;
				if (fallbackTheme) {
					applyTheme(fallbackTheme);
				}
				set('default');
				return;
			}

			applyTheme(theme);
			saveThemePreference(themeId);
			set(themeId);
		},
		/**
		 * Gets the theme definition for a given theme ID
		 * @param themeId - The theme ID to retrieve
		 * @returns The theme definition
		 */
		getTheme: (themeId: ThemeId): Theme | undefined => {
			return THEMES[themeId];
		},
		/**
		 * Gets all available themes
		 * @returns Array of all theme definitions
		 */
		getAvailableThemes: (): Theme[] => {
			return Object.values(THEMES);
		},
		/**
		 * Initializes the theme system
		 * Loads theme preference from localStorage or applies default
		 */
		initialize: () => {
			const savedTheme = loadThemePreference();
			const themeId = validateTheme(savedTheme) ? savedTheme : 'default';
			const theme = THEMES[themeId];
			
			if (theme) {
				applyTheme(theme);
				set(themeId);
			} else {
				// Fallback to default if theme not found
				const defaultTheme = THEMES.default;
				if (defaultTheme) {
					applyTheme(defaultTheme);
					set('default');
				}
			}
		}
	};
}

// Legacy store for backward compatibility
// New code should use themeStore.svelte.ts with $state runes
const legacyStore = createThemeStore();

// Import functions from new store for use in legacy store
import { setTheme, getTheme, getAvailableThemes, initializeTheme } from './themeStore.svelte';

// Re-export from new store for migration
export { themeState, setTheme, getTheme, getAvailableThemes, initializeTheme } from './themeStore.svelte';

// Legacy store instance (deprecated - use themeStore.svelte.ts instead)
export const themeStore = {
	subscribe: legacyStore.subscribe,
	setTheme,
	getTheme,
	getAvailableThemes,
	initialize: initializeTheme
};

