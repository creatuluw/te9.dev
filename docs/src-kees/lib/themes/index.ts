/**
 * Theme registry and exports
 * Central location for all theme definitions
 */

import { defaultTheme } from './default';
import { catalystTheme } from './catalyst';
import { pgliteTheme } from './pglite';
import { planetTheme } from './planet';
import { trevorTheme } from './trevor';
import { cursorTheme } from './cursor';
import { dreamsTheme } from './dreams';
import type { Theme, ThemeId } from '$lib/types/theme';

/**
 * Map of all available themes by ID
 */
export const themes: Record<ThemeId, Theme> = {
	default: defaultTheme,
	catalyst: catalystTheme,
	pglite: pgliteTheme,
	planet: planetTheme,
	trevor: trevorTheme,
	cursor: cursorTheme,
	dreams: dreamsTheme
};

/**
 * Array of all available themes
 */
export const allThemes: Theme[] = [defaultTheme, catalystTheme, pgliteTheme, planetTheme, trevorTheme, cursorTheme, dreamsTheme];

/**
 * Get theme by ID
 * @param themeId - Theme identifier
 * @returns Theme definition or undefined if not found
 */
export function getTheme(themeId: ThemeId): Theme | undefined {
	return themes[themeId];
}

/**
 * Check if a theme ID is valid
 * @param themeId - Theme identifier to validate
 * @returns True if theme ID is valid
 */
export function isValidThemeId(themeId: string): themeId is ThemeId {
	return themeId in themes;
}

// Export individual themes for direct import
export { defaultTheme, catalystTheme, pgliteTheme, planetTheme, trevorTheme, cursorTheme, dreamsTheme };

