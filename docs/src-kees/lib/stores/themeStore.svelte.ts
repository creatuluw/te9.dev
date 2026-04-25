/**
 * Theme store for managing theme state and persistence
 * 
 * **Svelte 5 Runes Pattern:**
 * Uses $state runes for reactive shared state, following Svelte 5 best practices.
 * Components can directly access state properties reactively without subscribe().
 * 
 * Provides reactive theme management with localStorage sync.
 */

import type { Theme, ThemeId } from '$lib/types/theme';
import { applyTheme, loadThemePreference, saveThemePreference, validateTheme } from '$lib/utils/theme';
import { themes } from '$lib/themes';

// Use the themes from the registry
const THEMES: Record<ThemeId, Theme> = themes;

/**
 * Reactive theme state using Svelte 5 $state runes
 * Components can directly access these properties reactively
 */
const savedTheme = typeof window !== 'undefined' ? loadThemePreference() : 'default';
const initialTheme: ThemeId = validateTheme(savedTheme) ? savedTheme : 'default';

export const themeState = $state({
	currentTheme: initialTheme as ThemeId
});

/**
 * Sets the active theme
 * 
 * @param themeId - The theme ID to activate
 * 
 * @example
 * ```typescript
 * setTheme('catalyst');
 * ```
 */
export function setTheme(themeId: ThemeId): void {
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
		themeState.currentTheme = 'default';
		return;
	}

	applyTheme(theme);
	themeState.currentTheme = themeId;
	// Sync to localStorage
	if (typeof window !== 'undefined') {
		saveThemePreference(themeId);
	}
}

/**
 * Gets the theme definition for a given theme ID
 * 
 * @param themeId - The theme ID to retrieve
 * @returns The theme definition
 * 
 * @example
 * ```typescript
 * const theme = getTheme('catalyst');
 * ```
 */
export function getTheme(themeId: ThemeId): Theme | undefined {
	return THEMES[themeId];
}

/**
 * Gets all available themes
 * 
 * @returns Array of all theme definitions
 * 
 * @example
 * ```typescript
 * const allThemes = getAvailableThemes();
 * ```
 */
export function getAvailableThemes(): Theme[] {
	return Object.values(THEMES);
}

/**
 * Initializes the theme system
 * Loads theme preference from localStorage or applies default
 * 
 * @example
 * ```typescript
 * initializeTheme();
 * ```
 */
export function initializeTheme(): void {
	const savedTheme = loadThemePreference();
	const themeId = validateTheme(savedTheme) ? savedTheme : 'default';
	const theme = THEMES[themeId];
	
	if (theme) {
		applyTheme(theme);
		themeState.currentTheme = themeId;
		// Sync to localStorage
		if (typeof window !== 'undefined') {
			saveThemePreference(themeId);
		}
	} else {
		// Fallback to default if theme not found
		const defaultTheme = THEMES.default;
		if (defaultTheme) {
			applyTheme(defaultTheme);
			themeState.currentTheme = 'default';
			// Sync to localStorage
			if (typeof window !== 'undefined') {
				saveThemePreference('default');
			}
		}
	}
}

