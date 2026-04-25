/**
 * Theme utility functions for theme management
 * Handles CSS variable updates, localStorage persistence, and theme validation
 */

import type { Theme, ThemeId } from '$lib/types/theme';

/**
 * Valid theme IDs that can be used
 */
const VALID_THEME_IDS: ThemeId[] = ['default', 'catalyst', 'pglite', 'planet', 'trevor', 'cursor', 'dreams'];

/**
 * Applies a theme by updating CSS custom properties on the document root
 * @param theme - The theme definition to apply
 */
export function applyTheme(theme: Theme): void {
	// SSR safety check
	if (typeof document === 'undefined') return;

	const root = document.documentElement;

	// Apply color variables
	root.style.setProperty('--theme-primary', theme.colors.primary);
	if (theme.colors.secondary) {
		root.style.setProperty('--theme-secondary', theme.colors.secondary);
	}
	root.style.setProperty('--theme-background', theme.colors.background);
	root.style.setProperty('--theme-surface', theme.colors.surface);
	root.style.setProperty('--theme-text-primary', theme.colors.text.primary);
	root.style.setProperty('--theme-text-secondary', theme.colors.text.secondary);
	root.style.setProperty('--theme-text-muted', theme.colors.text.muted);
	root.style.setProperty('--theme-border', theme.colors.border);
	root.style.setProperty('--theme-focus', theme.colors.focus);

	// Apply optional color variables
	if (theme.colors.error) {
		root.style.setProperty('--theme-error', theme.colors.error);
	}
	if (theme.colors.success) {
		root.style.setProperty('--theme-success', theme.colors.success);
	}
	if (theme.colors.warning) {
		root.style.setProperty('--theme-warning', theme.colors.warning);
	}

	// Apply font variables
	root.style.setProperty('--theme-font-heading', theme.fonts.heading);
	root.style.setProperty('--theme-font-body', theme.fonts.body);
	root.style.setProperty('--theme-font-mono', theme.fonts.mono);

	// Apply shadow variables if provided
	if (theme.shadows) {
		root.style.setProperty('--theme-shadow-xs', theme.shadows.xs);
		root.style.setProperty('--theme-shadow-sm', theme.shadows.sm);
		if (theme.shadows.md) {
			root.style.setProperty('--theme-shadow-md', theme.shadows.md);
		}
	}

	// Set theme attribute for CSS selectors
	root.setAttribute('data-theme', theme.id);
}

/**
 * Loads the theme preference from localStorage
 * @returns The saved theme ID, or null if not found or unavailable
 */
export function loadThemePreference(): ThemeId | null {
	if (typeof window === 'undefined') return null;

	try {
		const saved = localStorage.getItem('theme');
		return saved as ThemeId | null;
	} catch (error) {
		console.warn('Failed to load theme preference:', error);
		return null;
	}
}

/**
 * Saves the theme preference to localStorage
 * @param themeId - The theme ID to save
 */
export function saveThemePreference(themeId: ThemeId): void {
	if (typeof window === 'undefined') return;

	try {
		localStorage.setItem('theme', themeId);
	} catch (error) {
		console.warn('Failed to save theme preference:', error);
	}
}

/**
 * Validates if a string is a valid theme ID
 * @param themeId - The theme ID string to validate
 * @returns True if the theme ID is valid, false otherwise
 */
export function validateTheme(themeId: string | null): themeId is ThemeId {
	return themeId !== null && VALID_THEME_IDS.includes(themeId as ThemeId);
}

