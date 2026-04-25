/**
 * Theme type definitions for the theme selector system
 * Provides type-safe theme configuration and management
 */

/**
 * Theme ID - Branded type for theme identifiers
 */
export type ThemeId = 'default' | 'catalyst' | 'pglite' | 'planet' | 'trevor' | 'cursor' | 'dreams';

/**
 * Theme color palette configuration
 */
export interface ThemeColors {
	/** Main brand/primary color */
	primary: string;
	/** Secondary accent color (optional) */
	secondary?: string;
	/** Main background color */
	background: string;
	/** Card/surface background color */
	surface: string;
	/** Text color configuration */
	text: {
		/** Primary text color */
		primary: string;
		/** Secondary text color */
		secondary: string;
		/** Muted/subtle text color */
		muted: string;
	};
	/** Border color */
	border: string;
	/** Focus ring/indicator color */
	focus: string;
	/** Error state color (optional) */
	error?: string;
	/** Success state color (optional) */
	success?: string;
	/** Warning state color (optional) */
	warning?: string;
}

/**
 * Theme typography configuration
 */
export interface ThemeFonts {
	/** Heading font family */
	heading: string;
	/** Body font family */
	body: string;
	/** Monospace font family */
	mono: string;
}

/**
 * Theme shadow configuration (optional)
 */
export interface ThemeShadows {
	/** Extra small shadow */
	xs: string;
	/** Small shadow */
	sm: string;
	/** Medium shadow (optional) */
	md?: string;
}

/**
 * Complete theme definition
 */
export interface Theme {
	/** Unique theme identifier */
	id: ThemeId;
	/** Display name for the theme */
	name: string;
	/** Optional description of the theme */
	description?: string;
	/** Color palette configuration */
	colors: ThemeColors;
	/** Typography configuration */
	fonts: ThemeFonts;
	/** Shadow configuration (optional) */
	shadows?: ThemeShadows;
}

/**
 * Theme store state interface
 * Used internally by the theme store
 */
export interface ThemeState {
	/** Current active theme ID */
	currentTheme: ThemeId;
	/** List of all available themes */
	availableThemes: Theme[];
	/** Whether the theme system has been initialized */
	isInitialized: boolean;
}

