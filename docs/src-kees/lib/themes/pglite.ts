/**
 * PGlite theme - Dark mode design inspired by pglite.dev
 * Dark background with bright yellow/gold accents for a modern, tech-focused aesthetic
 */

import type { Theme } from '$lib/types/theme';

export const pgliteTheme: Theme = {
	id: 'pglite',
	name: 'PGlite',
	description: 'Dark mode design with yellow accents - inspired by pglite.dev',

	colors: {
		primary: '#fde047', // Yellow-300 - Bright yellow accent
		secondary: '#facc15', // Yellow-400 - Slightly darker yellow
		background: '#1a1a1a', // Dark charcoal/black background
		surface: '#27272a', // zinc-800 - Slightly lighter for cards/surfaces
		text: {
			primary: '#ffffff', // Pure white for main text
			secondary: '#e4e4e7', // zinc-200 - Light gray for secondary text
			muted: '#a1a1aa' // zinc-400 - Muted text
		},
		border: '#3f3f46', // zinc-700 - Subtle dark borders
		focus: '#fde047', // Yellow focus ring
		error: '#ef4444', // Red
		success: '#22c55e', // Green-500
		warning: '#f59e0b' // Amber
	},

	fonts: {
		heading: 'Inter, sans-serif', // Clean sans-serif
		body: 'Inter, sans-serif', // Inter font
		mono: 'PT Mono, monospace' // Monospace for code
	},

	shadows: {
		xs: '0 1px 2px 0 rgb(0 0 0 / 0.5)', // Darker shadow for dark background
		sm: '0 1px 3px 0 rgb(0 0 0 / 0.5), 0 1px 2px 0 rgb(0 0 0 / 0.3)' // Subtle dark shadow
	}
};

