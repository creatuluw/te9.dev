/**
 * Planet theme - ASCII-like, text-based design inspired by planetscale.com/blog
 * Minimalist design with monospace fonts, no rounded corners, and whitespace as design principle
 */

import type { Theme } from '$lib/types/theme';

export const planetTheme: Theme = {
	id: 'planet',
	name: 'Planet',
	description: 'ASCII-like, text-based design inspired by planetscale.com/blog - minimal styling with whitespace',

	colors: {
		primary: '#3a3b36', // Dark gray - primary text color from PlanetScale
		secondary: '#f35815', // Orange - accent color (#f35815 from PlanetScale)
		background: '#ffffff', // Pure white background
		surface: '#ffffff', // White surface/cards
		text: {
			primary: '#3a3b36', // Dark gray for main text (matches PlanetScale)
			secondary: '#737373', // gray-550 for secondary text
			muted: '#a1a1aa' // gray-400 for muted text
		},
		border: '#c1c1c1', // gray-300 - simple borders for ASCII-like feel
		focus: '#f35815', // Orange for focus states
		error: '#d92038',
		success: '#13862e',
		warning: '#f2b600'
	},

	fonts: {
		heading: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace', // Monospace for headings - ASCII feel
		body: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace', // Monospace for body - text-based design
		mono: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace' // Monospace for code
	},

	shadows: {
		xs: 'none', // No shadows - simple styling
		sm: 'none' // No shadows - simple styling
	}
};

