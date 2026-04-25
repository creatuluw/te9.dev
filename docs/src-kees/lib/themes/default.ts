/**
 * Default theme - Current zinc-based minimal design
 * This theme preserves the existing visual design exactly
 */

import type { Theme } from '$lib/types/theme';

export const defaultTheme: Theme = {
	id: 'default',
	name: 'Default',
	description: 'Clean, minimal zinc-based design - the current default theme',

	colors: {
		primary: '#3b82f6', // Blue accent (standard primary)
		background: '#ffffff', // White background
		surface: '#fafafa', // zinc-50 - Card/surface background
		text: {
			primary: '#18181b', // zinc-900 - Main text color
			secondary: '#52525b', // zinc-600 - Secondary text
			muted: '#a1a1aa' // zinc-400 - Muted/subtle text
		},
		border: '#e4e4e7', // zinc-200 - Border color
		focus: '#FE773C', // Orange focus color (from style.css)
		error: '#ef4444', // Red for errors
		success: '#10b981', // Green for success
		warning: '#f59e0b' // Amber for warnings
	},

	fonts: {
		heading: 'Aspekta, sans-serif',
		body: 'Inter, sans-serif',
		mono: 'PT Mono, monospace'
	},

	shadows: {
		xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
		sm: '0 1px 2px 0 rgb(0 0 0 / 0.05), 0 1px 3px 0 rgb(0 0 0 / 0.1)'
	}
};

