/**
 * Trevor theme - Clean, modern SaaS design inspired by trevor.io
 * Bright yellow accents on clean white background with professional dark grey text
 */

import type { Theme } from '$lib/types/theme';

export const trevorTheme: Theme = {
	id: 'trevor',
	name: 'Trevor',
	description: 'Clean SaaS design with bright yellow accents - inspired by trevor.io',

	colors: {
		primary: '#ffca38', // Bright yellow - main CTA button color
		secondary: '#416288', // Dark blue-grey - used for text and secondary elements
		background: '#ffffff', // Pure white background
		surface: '#ffffff', // White surface/cards
		text: {
			primary: '#416288', // Dark blue-grey for main text (from CSS)
			secondary: '#3a3b36', // Dark grey for secondary text
			muted: '#52525b' // zinc-600 for muted text
		},
		border: '#e4e4e7', // zinc-200 - subtle light borders
		focus: '#ffca38', // Yellow for focus states
		error: '#ef4444',
		success: '#22c55e',
		warning: '#f59e0b'
	},

	fonts: {
		heading: 'Inter, sans-serif', // DM Sans would be ideal, but Inter is close
		body: 'Inter, sans-serif', // Clean sans-serif
		mono: 'PT Mono, monospace' // Monospace for code
	},

	shadows: {
		xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
		sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06)'
	}
};

